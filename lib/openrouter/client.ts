// lib/openrouter/client.ts

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OpenRouterResponse {
    id: string;
    choices: {
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
}

export class OpenRouterClient {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1';
    private defaultModel: string;

  constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY!;
        this.defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet';
  }

  async chat(
        messages: OpenRouterMessage[],
        options?: {
                model?: string;
                temperature?: number;
                maxTokens?: number;
                jsonMode?: boolean;
        }
      ): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                          'Authorization': `Bearer ${this.apiKey}`,
                          'Content-Type': 'application/json',
                          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://fyndfluencer.com',
                          'X-Title': 'FyndFluencer'
                },
                body: JSON.stringify({
                          model: options?.model || this.defaultModel,
                          messages,
                          temperature: options?.temperature ?? 0.7,
                          max_tokens: options?.maxTokens ?? 2000,
                          response_format: options?.jsonMode ? { type: 'json_object' } : undefined
                })
        });

      if (!response.ok) {
              const error = await response.text();
              throw new Error(`OpenRouter API error: ${error}`);
      }

      const data: OpenRouterResponse = await response.json();
        return data.choices[0].message.content;
  }

  async generateJSON<T>(
        prompt: string,
        systemPrompt?: string
      ): Promise<T> {
        const messages: OpenRouterMessage[] = [];

      if (systemPrompt) {
              messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const response = await this.chat(messages, { jsonMode: true });
        return JSON.parse(response) as T;
  }
}

export const openrouter = new OpenRouterClient();
