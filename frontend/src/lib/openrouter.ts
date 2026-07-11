/**
 * OpenRouter AI integration for form generation.
 * Uses free models (no API key required for some, or uses free tier).
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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

function getOpenRouterKey(): string {
  return process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
}

function getGeminiKey(): string {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
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
      
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
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
  const geminiKey = getGeminiKey();
  const openRouterKey = getOpenRouterKey();
  
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

  let cleanContent = '';

  try {
    // 1. Try native Gemini API first if key exists
    if (geminiKey) {
      console.log('[AI] Using native Gemini API...');
      const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: { parts: { text: prompt } },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            responseMimeType: "application/json"
          }
        }),
      }, 3, 1500);

      if (!response.ok) {
        console.error('[AI] Gemini API error:', response.status);
        throw new Error(`Gemini API error (${response.status})`);
      }

      const data = await response.json();
      cleanContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } 
    // 2. Fall back to OpenRouter
    else {
      console.log('[AI] Using OpenRouter API...');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://typeform-clone.vercel.app',
        'X-Title': 'Typeform Clone',
      };
      if (openRouterKey) headers['Authorization'] = `Bearer ${openRouterKey}`;

      const response = await fetchWithRetry(OPENROUTER_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          models: ['openrouter/auto', 'google/gemini-2.5-flash-lite', 'google/gemini-2.0-flash-lite-preview-02-05:free'],
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      }, 3, 1500);

      if (!response.ok) {
        throw new Error(`OpenRouter API error (${response.status})`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '';
      cleanContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    if (!cleanContent) {
      throw new Error('AI returned empty response');
    }

    console.log('[AI] Parsing response...');
    
    const parsed = JSON.parse(cleanContent);
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response structure');
    }

    // Sanitize AI Output
    parsed.questions = parsed.questions.map((q: any) => ({
      ...q,
      is_required: q.is_required === true || q.is_required === 'true' || q.is_required === 'True',
      settings: q.settings || null
    }));

    console.log('[AI] Success! Generated', parsed.questions.length, 'questions');
    return parsed as GeneratedForm;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[AI] Request timeout');
      throw new Error('AI request timed out. Service is busy, please try again.');
    }
    console.error('[AI] Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
