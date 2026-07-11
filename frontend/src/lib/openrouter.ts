/**
 * OpenRouter AI integration for form generation.
 * Uses free models (no API key required for some, or uses free tier).
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface GeneratedQuestion {
  type: string;
  title: string;
  description?: string;
  is_required: boolean;
  settings?: {
    options?: string[];
    min?: number;
    max?: number;
  };
}

export interface GeneratedForm {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

function getApiKey(): string {
  // Check for env var (set in .env.local)
  const key = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  return key;
}

// Retry logic with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout per attempt
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Don't retry on client errors except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // Retry on 429 or 5xx
      if (response.status === 429 || response.status >= 500) {
        if (i < maxRetries - 1) {
          const delayMs = initialDelayMs * Math.pow(2, i); // Exponential backoff
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, i);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export async function generateFormWithAI(prompt: string): Promise<GeneratedForm> {
  const apiKey = getApiKey();
  
  const systemPrompt = `You are a form-building assistant. Given a description of a form, generate a structured form with questions.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "title": "string",
  "description": "string",
  "questions": [
    {
      "type": "short_text|long_text|multiple_choice|dropdown|email|number|yes_no|rating",
      "title": "string",
      "description": "optional string",
      "is_required": true|false,
      "settings": {
        "options": ["option1", "option2"],
        "min": 1,
        "max": 5
      }
    }
  ]
}

Rules:
- Generate 3-8 questions unless the prompt specifies
- Use appropriate question types for the content
- multiple_choice and dropdown MUST have an "options" array
- rating should have min:1, max:5 by default
- Make questions relevant to the form topic`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://typeform-clone.vercel.app',
    'X-Title': 'Typeform Clone',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetchWithRetry(OPENROUTER_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    }, 3, 1500);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      if (response.status === 429) {
        throw new Error('API is overloaded. Please wait a minute and try again.');
      }
      if (response.status >= 500) {
        throw new Error('AI service temporarily unavailable. Try again in a minute.');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI service');
    }

    // Strip markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanContent);
      
      // Validate the response structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response format');
      }

      return parsed as GeneratedForm;
    } catch {
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. The AI service is busy. Try again shortly.');
    }
    throw error;
  }
}
