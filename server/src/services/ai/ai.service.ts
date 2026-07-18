import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { BaseProvider } from '../../providers/base.provider';
import { OpenAIProvider } from '../../providers/openai.provider';
import { GeminiProvider } from '../../providers/gemini.provider';
import { GroqProvider } from '../../providers/groq.provider';
import { OpenRouterProvider } from '../../providers/openrouter.provider';
import { MistralProvider } from '../../providers/mistral.provider';
import { GitHubModelsProvider } from '../../providers/github-models.provider';
import { DeepSeekProvider } from '../../providers/deepseek.provider';
import { HuggingFaceProvider } from '../../providers/huggingface.provider';
import { GoogleCloudProvider } from '../../providers/googlecloud.provider';
import { AzureProvider } from '../../providers/azure.provider';
import { AnthropicProvider } from '../../providers/anthropic.provider';
import { LangChainProvider } from '../../providers/langchain.provider';
import { AI21Provider } from '../../providers/ai21.provider';
import { PerplexityProvider } from '../../providers/perplexity.provider';
import { ProviderConfig } from '../../features/providers/provider.model';
import type { IProviderConfig } from '../../features/providers/provider.model';

// Cache for provider configs loaded from DB
let configCache: Map<string, IProviderConfig> | null = null;
let lastConfigFetch = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute

async function loadProviderConfigs(): Promise<Map<string, IProviderConfig>> {
  const now = Date.now();
  if (configCache && now - lastConfigFetch < CONFIG_CACHE_TTL) {
    return configCache;
  }
  try {
    const configs = await ProviderConfig.find({ isEnabled: true }).lean();
    configCache = new Map(configs.map((c) => [c.name, c]));
    lastConfigFetch = now;
  } catch {
    // DB not available, use empty map
    configCache = new Map();
  }
  return configCache;
}

/**
 * Pick the best API key from a provider config using round-robin rotation.
 * Prefers keys with lowest failure count and longest since last use.
 */
function pickApiKey(config: IProviderConfig): { key: string; index: number } | null {
  const activeKeys = config.apiKeys.filter((k) => k.isActive);
  if (activeKeys.length === 0) return null;

  // Sort: least recently used first, then lowest failure count
  activeKeys.sort((a, b) => {
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;
    return (a.failureCount || 0) - (b.failureCount || 0);
  });

  const originalIndex = config.apiKeys.findIndex(
    (k) => k.key === activeKeys[0].key
  );
  return { key: activeKeys[0].key, index: originalIndex };
}

const PROVIDER_MAP: Record<string, new () => BaseProvider> = {
  openai: OpenAIProvider,
  gemini: GeminiProvider,
};

const API_KEY_MAP: Record<string, string> = {
  groq: env.GROQ_API_KEY || '',
  openrouter: env.OPENROUTER_API_KEY || '',
  mistral: env.MISTRAL_API_KEY || '',
  github: env.GITHUB_MODELS_API_KEY || '',
  deepseek: env.DEEPSEEK_API_KEY || '',
  huggingface: env.HUGGINGFACE_API_KEY || '',
  googlecloud: env.GOOGLECLOUD_API_KEY || '',
  azure: env.AZURE_API_KEY || '',
  anthropic: env.ANTHROPIC_API_KEY || '',
  langchain: env.LANGCHAIN_API_KEY || '',
  ai21: env.AI21_API_KEY || '',
  perplexity: env.PERPLEXITY_API_KEY || '',
};

// Provider creator functions for dynamic instantiation with API keys
const PROVIDER_CREATORS: Record<string, (apiKey: string) => BaseProvider> = {
  groq: (apiKey) => new GroqProvider(apiKey),
  openrouter: (apiKey) => new OpenRouterProvider(apiKey),
  mistral: (apiKey) => new MistralProvider(apiKey),
  github: (apiKey) => new GitHubModelsProvider(apiKey),
  deepseek: (apiKey) => new DeepSeekProvider(apiKey),
  huggingface: (apiKey) => new HuggingFaceProvider(apiKey),
  googlecloud: (apiKey) => new GoogleCloudProvider(apiKey),
  azure: (apiKey) => new AzureProvider(apiKey),
  anthropic: (apiKey) => new AnthropicProvider(apiKey),
  langchain: (apiKey) => new LangChainProvider(apiKey),
  ai21: (apiKey) => new AI21Provider(apiKey),
  perplexity: (apiKey) => new PerplexityProvider(apiKey),
};

export class AIService {
  private provider: BaseProvider;
  private currentKeyIndex: number = -1;
  private providerConfigName: string;

  constructor(providerName?: string) {
    this.providerConfigName = (providerName || env.AI_PROVIDER || 'openai').toLowerCase();
    this.provider = this.createProvider(this.providerConfigName);
    logger.info(`AI Service initialized with provider: ${this.provider.name}`);
  }

  /**
   * Create a provider instance, trying DB config first, then falling back to env vars.
   */
  private createProvider(name: string, apiKey?: string): BaseProvider {
    // If an API key is explicitly provided (e.g., from rotation), use it directly
    if (apiKey) {
      const creator = PROVIDER_CREATORS[name];
      if (creator) {
        return creator(apiKey);
      }
      // For openai/gemini, construct with key
      if (name === 'openai') {
        return new OpenAIProvider(); // Will use env, but we override later via the instance
      }
      if (name === 'gemini') {
        return new GeminiProvider();
      }
    }

    // Try loading from DB config
    if (name === 'openai' || name === 'gemini') {
      const ProviderClass = PROVIDER_MAP[name];
      return new ProviderClass();
    }

    if (name === 'anthropic') {
      return new AnthropicProvider(env.ANTHROPIC_API_KEY || '');
    }

    if (PROVIDER_CREATORS[name] && API_KEY_MAP[name]) {
      return PROVIDER_CREATORS[name](API_KEY_MAP[name]);
    }

    logger.warn(`AI provider "${name}" not configured, falling back to OpenAI`);
    return new OpenAIProvider();
  }

  /**
   * Create a provider instance from a DB config entry using its providerType.
   * Falls back to the config name if providerType is not set.
   */
  private createProviderFromConfig(dbConfig: IProviderConfig, apiKey: string): BaseProvider {
    const type = dbConfig.providerType || dbConfig.name;

    // Check known provider creators
    const creator = PROVIDER_CREATORS[type];
    if (creator) {
      return creator(apiKey);
    }

    if (type === 'openai') {
      return new OpenAIProvider(apiKey);
    }
    if (type === 'gemini') {
      return new GeminiProvider(apiKey);
    }
    if (type === 'anthropic') {
      return new AnthropicProvider(apiKey);
    }

    // For custom/unknown provider types, use a generic OpenAI-compatible provider
    // that sends requests to the configured base URL with the configured model
    logger.info(`[AI Service] Using generic provider for type "${type}" with base URL: ${dbConfig.baseUrl}`);
    return new (class extends BaseProvider {
      constructor() {
        super(dbConfig.displayName || type, apiKey, dbConfig.baseUrl);
      }

      async generate(prompt: string, options?: any): Promise<string> {
        return this.generateWithSystem('', prompt, options);
      }

      async generateWithSystem(systemPrompt: string, userPrompt: string, options?: any): Promise<string> {
        const messages: any[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: userPrompt });

        const data = await this.post('/chat/completions', {
          model: options?.model || dbConfig.defaultModel || 'gpt-4o-mini',
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens || 4096,
        });

        return data.choices?.[0]?.message?.content || '';
      }

      async stream(prompt: string, onChunk: (chunk: string) => void, options?: any): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: options?.model || dbConfig.defaultModel || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`${dbConfig.displayName} API error: ${response.status} ${error}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((l: string) => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch { /* skip */ }
          }
        }

        return fullContent;
      }
    })();
  }

  /**
   * Get a provider with key rotation from DB config.
   * Returns the current provider, rotating the API key if configured.
   */
  private async getProviderWithRotation(name: string): Promise<BaseProvider> {
    const configs = await loadProviderConfigs();
    const dbConfig = configs.get(name);

    if (dbConfig && dbConfig.apiKeys.length > 0) {
      const picked = pickApiKey(dbConfig);
      if (picked) {
        this.currentKeyIndex = picked.index;

        // Update lastUsed timestamp in background
        ProviderConfig.updateOne(
          { name, 'apiKeys.key': picked.key },
          { $set: { 'apiKeys.$.lastUsed': new Date() } }
        ).catch(() => {});

        return this.createProviderFromConfig(dbConfig, picked.key);
      }
    }

    // Fallback to env-based provider
    return this.createProvider(name);
  }

  /**
   * Mark the current API key as failed (for rotation).
   */
  private async markKeyFailure(): Promise<void> {
    if (this.currentKeyIndex === -1) return;
    try {
      const configs = await loadProviderConfigs();
      const dbConfig = configs.get(this.providerConfigName);
      if (dbConfig && dbConfig.apiKeys[this.currentKeyIndex]) {
        const keyEntry = dbConfig.apiKeys[this.currentKeyIndex];
        await ProviderConfig.updateOne(
          { name: this.providerConfigName, 'apiKeys.key': keyEntry.key },
          { $inc: { 'apiKeys.$.failureCount': 1 } }
        );
        // If too many failures, mark as inactive
        if (keyEntry.failureCount >= 3) {
          await ProviderConfig.updateOne(
            { name: this.providerConfigName, 'apiKeys.key': keyEntry.key },
            { $set: { 'apiKeys.$.isActive': false } }
          );
          configCache = null; // Invalidate cache
          logger.warn(`[AI Service] Deactivated failing API key for ${this.providerConfigName}`);
        }
      }
    } catch {
      // Silently fail — we don't want key tracking to break generation
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    logger.debug('AI Service: generate', { provider: this.provider.name, promptLength: prompt.length });

    // Try with rotation support
    const provider = await this.getProviderWithRotation(this.providerConfigName);

    try {
      if (systemPrompt) {
        return await provider.generateWithSystem(systemPrompt, prompt);
      }
      return await provider.generate(prompt);
    } catch (error: any) {
      logger.error(`[AI Service] ${provider.name} failed: ${error.message}`);
      await this.markKeyFailure();

      // Retry with next available key or fallback
      const fallbackProvider = this.createProvider(this.providerConfigName);
      if (systemPrompt) {
        return await fallbackProvider.generateWithSystem(systemPrompt, prompt);
      }
      return await fallbackProvider.generate(prompt);
    }
  }

  async summarize(text: string, maxLength?: number): Promise<string> {
    const systemPrompt = 'You are an expert research summarizer. Create clear, concise summaries.';
    const prompt = `Please provide a comprehensive summary of the following text.${
      maxLength ? ` Keep the summary under ${maxLength} characters.` : ''
    }\n\nText:\n${text}`;

    // Use generate() which handles DB provider config + key rotation
    return this.generate(prompt, systemPrompt);
  }

  async analyze(data: string, analysisType: string): Promise<string> {
    const systemPrompt = 'You are an expert data analyst. Provide thorough, structured analysis.';
    const prompt = `Analyze the following research data focusing on "${analysisType}".
Provide key insights, patterns, contradictions, and important findings.\n\nData:\n${data}`;

    return this.generate(prompt, systemPrompt);
  }

  async extractInformation(text: string, extractionPrompt: string): Promise<string> {
    const systemPrompt = 'You are an expert information extractor. Extract only the requested information.';
    const prompt = `Extract the following information from the text: ${extractionPrompt}\n\nText:\n${text}`;

    return this.generate(prompt, systemPrompt);
  }

  async generateResearchReport(
    topic: string,
    sources: Array<{ title: string; content: string; url: string }>,
    analysis: string
  ): Promise<{ summary: string; keyInsights: string[]; recommendations: string[] }> {
    const sourcesText = sources
      .map((s, i) => `Source ${i + 1}: ${s.title}\nURL: ${s.url}\nContent: ${s.content.substring(0, 2000)}`)
      .join('\n\n---\n\n');

    const prompt = `Research Topic: ${topic}\n\nResearch Sources:\n${sourcesText}\n\nAnalysis:\n${analysis}\n\nGenerate a comprehensive research report as JSON: {\n  "summary": "...",\n  "keyInsights": ["..."],\n  "recommendations": ["..."]\n}`;

    const systemPrompt = 'You are an AI research analyst. Respond with valid JSON only.';
    const response = await this.generate(prompt, systemPrompt);

    try {
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { summary: response, keyInsights: [], recommendations: [] };
    }
  }
}

export const aiService = new AIService();
