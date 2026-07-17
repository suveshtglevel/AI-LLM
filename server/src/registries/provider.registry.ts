import { logger } from '../config/logger';
import { BaseProvider } from '../providers/base.provider';

export interface IProviderRegistration {
  name: string;
  displayName: string;
  /** Environment variable name that holds the API key */
  apiKeyEnvVar: string;
  /** Whether this provider is configured (has API key) */
  isConfigured: boolean;
  createInstance: () => BaseProvider;
  healthCheck?: () => Promise<{ healthy: boolean; latencyMs: number; error?: string }>;
}

class ProviderRegistryClass {
  private providers = new Map<string, IProviderRegistration>();

  register(provider: IProviderRegistration): void {
    if (this.providers.has(provider.name)) {
      logger.warn(`[ProviderRegistry] Overwriting provider: ${provider.name}`);
    }
    this.providers.set(provider.name, provider);
    logger.debug(`[ProviderRegistry] Registered: ${provider.name} (configured: ${provider.isConfigured})`);
  }

  get(name: string): IProviderRegistration | undefined {
    return this.providers.get(name);
  }

  list(): IProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  listConfigured(): IProviderRegistration[] {
    return this.list().filter(p => p.isConfigured);
  }

  /**
   * Get a provider instance by name. Falls back to the first configured provider.
   */
  getWithFallback(name: string): BaseProvider | null {
    // Try the requested provider
    const registration = this.providers.get(name);
    if (registration?.isConfigured) {
      return registration.createInstance();
    }

    // Fallback to any configured provider
    const configured = this.listConfigured();
    if (configured.length > 0) {
      logger.warn(`[ProviderRegistry] "${name}" not configured, falling back to "${configured[0].name}"`);
      return configured[0].createInstance();
    }

    logger.error('[ProviderRegistry] No configured providers available');
    return null;
  }

  /**
   * Run health checks on all configured providers.
   */
  async healthCheckAll(): Promise<Record<string, { healthy: boolean; latencyMs: number; error?: string }>> {
    const results: Record<string, { healthy: boolean; latencyMs: number; error?: string }> = {};

    for (const [name, provider] of this.providers) {
      if (provider.healthCheck) {
        try {
          results[name] = await provider.healthCheck();
        } catch (error) {
          results[name] = { healthy: false, latencyMs: 0, error: 'Health check threw exception' };
        }
      } else {
        results[name] = { healthy: provider.isConfigured, latencyMs: 0, error: provider.isConfigured ? undefined : 'Not configured' };
      }
    }

    return results;
  }

  count(): number {
    return this.providers.size;
  }
}

export const ProviderRegistry = new ProviderRegistryClass();
