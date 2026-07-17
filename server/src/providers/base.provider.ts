export interface ProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
}

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export abstract class BaseProvider {
  public readonly name: string;
  protected apiKey: string;
  protected baseUrl: string;

  constructor(name: string, apiKey: string, baseUrl: string) {
    this.name = name;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract generate(prompt: string, options?: ProviderOptions): Promise<string>;
  abstract generateWithSystem(systemPrompt: string, userPrompt: string, options?: ProviderOptions): Promise<string>;
  abstract stream(prompt: string, onChunk: (chunk: string) => void, options?: ProviderOptions): Promise<string>;

  protected async post(path: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${this.name} API error: ${response.status} ${error}`);
    }

    return response.json();
  }
}
