import { env } from '../config/env';
import { BaseProvider, ProviderMessage, ProviderOptions } from './base.provider';
import { ProviderRegistry } from '../registries/provider.registry';

// Auto-register
ProviderRegistry.register({
  name: 'mistral',
  displayName: 'Mistral',
  apiKeyEnvVar: 'MISTRAL_API_KEY',
  isConfigured: !!env.MISTRAL_API_KEY,
  createInstance: () => new MistralProvider(env.MISTRAL_API_KEY),
});

export class MistralProvider extends BaseProvider {
  constructor(apiKey: string) {
    super('Mistral', apiKey, 'https://api.mistral.ai/v1');
  }

  async generate(prompt: string, options?: ProviderOptions): Promise<string> {
    return this.generateWithSystem('', prompt, options);
  }

  async generateWithSystem(systemPrompt: string, userPrompt: string, options?: ProviderOptions): Promise<string> {
    const messages: ProviderMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });

    const data = await this.post('/chat/completions', {
      model: options?.model || 'mistral-small-latest',
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
        model: options?.model || 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    });

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
