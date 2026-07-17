import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { BaseProvider } from '../../providers/base.provider';
import { OpenAIProvider } from '../../providers/openai.provider';
import { GeminiProvider } from '../../providers/gemini.provider';
import { GroqProvider } from '../../providers/groq.provider';
import { OpenRouterProvider } from '../../providers/openrouter.provider';
import { MistralProvider } from '../../providers/mistral.provider';
import { GitHubModelsProvider } from '../../providers/github-models.provider';

const PROVIDER_MAP: Record<string, new () => BaseProvider> = {
  openai: OpenAIProvider,
  gemini: GeminiProvider,
};

const API_KEY_MAP: Record<string, string> = {
  groq: env.GROQ_API_KEY || '',
  openrouter: env.OPENROUTER_API_KEY || '',
  mistral: env.MISTRAL_API_KEY || '',
  github: env.GITHUB_MODELS_API_KEY || '',
};

export class AIService {
  private provider: BaseProvider;

  constructor(providerName?: string) {
    const name = (providerName || env.AI_PROVIDER || 'openai').toLowerCase();

    if (name === 'openai' || name === 'gemini') {
      const ProviderClass = PROVIDER_MAP[name];
      this.provider = new ProviderClass();
    } else if (API_KEY_MAP[name]) {
      switch (name) {
        case 'groq': this.provider = new GroqProvider(API_KEY_MAP[name]); break;
        case 'openrouter': this.provider = new OpenRouterProvider(API_KEY_MAP[name]); break;
        case 'mistral': this.provider = new MistralProvider(API_KEY_MAP[name]); break;
        case 'github': this.provider = new GitHubModelsProvider(API_KEY_MAP[name]); break;
        default: this.provider = new OpenAIProvider();
      }
    } else {
      logger.warn(`AI provider "${name}" not configured, falling back to OpenAI`);
      this.provider = new OpenAIProvider();
    }

    logger.info(`AI Service initialized with provider: ${this.provider.name}`);
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    logger.debug('AI Service: generate', { provider: this.provider.name, promptLength: prompt.length });
    if (systemPrompt) {
      return this.provider.generateWithSystem(systemPrompt, prompt);
    }
    return this.provider.generate(prompt);
  }

  async summarize(text: string, maxLength?: number): Promise<string> {
    const prompt = `Please provide a comprehensive summary of the following text.${
      maxLength ? ` Keep the summary under ${maxLength} characters.` : ''
    }\n\nText:\n${text}`;

    return this.provider.generateWithSystem(
      'You are an expert research summarizer. Create clear, concise summaries.',
      prompt
    );
  }

  async analyze(data: string, analysisType: string): Promise<string> {
    const prompt = `Analyze the following research data focusing on "${analysisType}".
Provide key insights, patterns, contradictions, and important findings.\n\nData:\n${data}`;

    return this.provider.generateWithSystem(
      'You are an expert data analyst. Provide thorough, structured analysis.',
      prompt
    );
  }

  async extractInformation(text: string, extractionPrompt: string): Promise<string> {
    const prompt = `Extract the following information from the text: ${extractionPrompt}\n\nText:\n${text}`;
    return this.provider.generateWithSystem(
      'You are an expert information extractor. Extract only the requested information.',
      prompt
    );
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

    const response = await this.provider.generateWithSystem(
      'You are an AI research analyst. Respond with valid JSON only.',
      prompt
    );

    try {
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { summary: response, keyInsights: [], recommendations: [] };
    }
  }
}

export const aiService = new AIService();
