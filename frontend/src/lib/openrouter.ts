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

// Retry logic with exponential backoff - more aggressive for rate limits
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 5,
  initialDelayMs: number = 2000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Don't retry on most errors
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // Retry on 429 (rate limit) or 5xx errors
      if (response.status === 429 || response.status >= 500) {
        if (i < maxRetries - 1) {
          const delayMs = initialDelayMs * Math.pow(2, i);
          console.log(`[AI] Retry ${i + 1}/${maxRetries} after ${delayMs}ms (HTTP ${response.status})`);
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, i);
        console.log(`[AI] Retry ${i + 1}/${maxRetries} after ${delayMs}ms (error: ${(error as Error).message})`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

export async function generateFormWithAI(prompt: string): Promise<GeneratedForm> {
  const apiKey = getApiKey();
  
  console.log('[AI] Starting form generation with prompt:', prompt.substring(0, 50) + '...');
  
  const systemPrompt = `You are a form-building assistant. Given a description of a form, generate a structured form with questions.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "title": "string",
  "description": "string",
  "questions": [
    {
      "type": "short_text|long_text|multiple_choice|dropdown|email|number|yes_no|rating|date|statement|phone_number",
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
    console.log('[AI] Using provided API key');
  } else {
    console.log('[AI] Using OpenRouter free tier (no API key)');
  }

  try {
    console.log('[AI] Sending request to OpenRouter...');
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

    console.log('[AI] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('[AI] API error response:', response.status, errorText.substring(0, 200));
      
      if (response.status === 429) {
        throw new Error('OpenRouter rate limit exceeded. Please wait a minute and try again.');
      }
      if (response.status >= 500) {
        throw new Error('OpenRouter service error. Try again in a few seconds.');
      }
      throw new Error(`OpenRouter error (${response.status})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('[AI] No content in response:', data);
      throw new Error('AI returned empty response');
    }

    console.log('[AI] Parsing response (length:', content.length + ')...');
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanContent);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        console.error('[AI] Invalid structure:', parsed);
        throw new Error('Invalid response structure');
      }

      console.log('[AI] Success! Generated', parsed.questions.length, 'questions');
      return parsed as GeneratedForm;
    } catch (parseErr) {
      console.error('[AI] Parse error:', parseErr, 'Content:', cleanContent.substring(0, 300));
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[AI] Request timeout after 25 seconds');
      throw new Error('AI request timed out. Service is busy, please try again.');
    }
    console.error('[AI] Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
