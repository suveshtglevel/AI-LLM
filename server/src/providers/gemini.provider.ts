import { env } from '../config/env';
import { BaseProvider, ProviderMessage, ProviderOptions } from './base.provider';
import { ProviderRegistry } from '../registries/provider.registry';

// Auto-register
ProviderRegistry.register({
  name: 'gemini',
  displayName: 'Gemini',
  apiKeyEnvVar: 'GEMINI_API_KEY',
  isConfigured: !!env.GEMINI_API_KEY,
  createInstance: () => new GeminiProvider(),
});

export class GeminiProvider extends BaseProvider {
  constructor() {
    super('Gemini', env.GEMINI_API_KEY, 'https://generativelanguage.googleapis.com/v1beta');
  }

  async generate(prompt: string, options?: ProviderOptions): Promise<string> {
    return this.generateWithSystem('', prompt, options);
  }

  async generateWithSystem(systemPrompt: string, userPrompt: string, options?: ProviderOptions): Promise<string> {
    const contents: any[] = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
    }
    contents.push({ role: 'user', parts: [{ text: userPrompt }] });

    const data = await this.post(
      `/models/${options?.model || 'gemini-pro'}:generateContent?key=${this.apiKey}`,
      { contents }
    );

    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async stream(prompt: string, onChunk: (chunk: string) => void, options?: ProviderOptions): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/models/${options?.model || 'gemini-pro'}:streamContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      }
    );

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      fullContent += text;
      onChunk(text);
    }

    return fullContent;
  }
}
