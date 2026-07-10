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
        "options": ["option1", "option2"],  // required for multiple_choice and dropdown
        "min": 1,  // optional for rating
        "max": 5   // optional for rating
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

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content returned from AI');
  }

  // Strip markdown code blocks if present
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const parsed = JSON.parse(cleanContent);
    return parsed as GeneratedForm;
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
}
