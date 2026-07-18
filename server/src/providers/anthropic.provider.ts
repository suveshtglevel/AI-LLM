import { env } from '../config/env';
import { BaseProvider, ProviderMessage, ProviderOptions } from './base.provider';
import { ProviderRegistry } from '../registries/provider.registry';

ProviderRegistry.register({
  name: 'anthropic',
  displayName: 'Anthropic Claude',
  apiKeyEnvVar: 'ANTHROPIC_API_KEY',
  isConfigured: !!env.ANTHROPIC_API_KEY,
  createInstance: () => new AnthropicProvider(env.ANTHROPIC_API_KEY),
});

export class AnthropicProvider extends BaseProvider {
  constructor(apiKey: string) {
    super('Anthropic', apiKey, 'https://api.anthropic.com/v1');
  }

  async generate(prompt: string, options?: ProviderOptions): Promise<string> {
    return this.generateWithSystem('', prompt, options);
  }

  async generateWithSystem(systemPrompt: string, userPrompt: string, options?: ProviderOptions): Promise<string> {
    const messages: ProviderMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });

    const data = await this.post('/messages', {
      model: options?.model || 'claude-3-haiku-20240307',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
      system: systemPrompt || undefined,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return data.content?.[0]?.text || '';
  }

  async stream(prompt: string, onChunk: (chunk: string) => void, options?: ProviderOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
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
          const content = parsed.delta?.text || parsed.content_block?.text || '';
          if (content) { fullContent += content; onChunk(content); }
        } catch { /* skip */ }
      }
    }

    return fullContent;
  }
}
