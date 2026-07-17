import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { ProviderRegistry } from '../../registries/provider.registry';

const router = Router();
router.use(authenticate);

/**
 * GET /api/providers
 * List all AI providers with health status
 */
router.get('/', async (_req, res, next) => {
  try {
    const providers = ProviderRegistry.list();
    const health = await ProviderRegistry.healthCheckAll();

    res.json({
      success: true,
      data: {
        providers: providers.map(p => ({
          name: p.name,
          displayName: p.displayName,
          isConfigured: p.isConfigured,
          healthy: health[p.name]?.healthy ?? p.isConfigured,
          latencyMs: health[p.name]?.latencyMs ?? 0,
        })),
        total: providers.length,
      },
    });
  } catch (error) { next(error); }
});

export default router;
