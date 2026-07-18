import { env } from '../config/env';
import { BaseProvider, ProviderMessage, ProviderOptions } from './base.provider';
import { ProviderRegistry } from '../registries/provider.registry';

ProviderRegistry.register({
  name: 'perplexity',
  displayName: 'Perplexity AI',
  apiKeyEnvVar: 'PERPLEXITY_API_KEY',
  isConfigured: !!env.PERPLEXITY_API_KEY,
  createInstance: () => new PerplexityProvider(env.PERPLEXITY_API_KEY),
});

export class PerplexityProvider extends BaseProvider {
  constructor(apiKey: string) {
    super('Perplexity', apiKey, 'https://api.perplexity.ai');
  }

  async generate(prompt: string, options?: ProviderOptions): Promise<string> {
    return this.generateWithSystem('', prompt, options);
  }

  async generateWithSystem(systemPrompt: string, userPrompt: string, options?: ProviderOptions): Promise<string> {
    const messages: ProviderMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });

    const data = await this.post('/chat/completions', {
      model: options?.model || 'sonar-pro',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 4096,
    });

    return data.choices[0]?.message?.content || '';
  }

  async stream(prompt: string, onChunk: (chunk: string) => void, options?: ProviderOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'sonar-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${error}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          if (content) { fullContent += content; onChunk(content); }
        } catch { /* skip */ }
      }
    }

    return fullContent;
  }
}
