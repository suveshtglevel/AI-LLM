import { env } from '../config/env';
import { BaseProvider, ProviderMessage, ProviderOptions } from './base.provider';
import { ProviderRegistry } from '../registries/provider.registry';

ProviderRegistry.register({
  name: 'langchain',
  displayName: 'LangChain',
  apiKeyEnvVar: 'LANGCHAIN_API_KEY',
  isConfigured: !!env.LANGCHAIN_API_KEY,
  createInstance: () => new LangChainProvider(env.LANGCHAIN_API_KEY),
});

export class LangChainProvider extends BaseProvider {
  constructor(apiKey: string) {
    super('LangChain', apiKey, 'https://api.langchain.com/v1');
  }

  async generate(prompt: string, options?: ProviderOptions): Promise<string> {
    return this.generateWithSystem('', prompt, options);
  }

  async generateWithSystem(systemPrompt: string, userPrompt: string, options?: ProviderOptions): Promise<string> {
    const messages: ProviderMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });

    const data = await this.post('/chat/completions', {
      model: options?.model || 'llama-2-70b-chat',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
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
        model: options?.model || 'llama-2-70b-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LangChain API error: ${response.status} ${error}`);
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
