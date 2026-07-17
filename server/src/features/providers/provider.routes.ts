import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { ProviderConfig } from './provider.model';
import {
  createProviderSchema,
  updateProviderSchema,
  addApiKeySchema,
} from './provider.validation';
import { ProviderRegistry } from '../../registries/provider.registry';

const router = Router();
router.use(authenticate);

/**
 * GET /api/providers/configs
 * List all provider configurations from the database
 */
router.get('/configs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await ProviderConfig.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/providers/configs/:name
 * Get a single provider configuration
 */
router.get('/configs/:name', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.params.name).toLowerCase();
    const config = await ProviderConfig.findOne({ name }).lean();
    if (!config) {
      res.status(404).json({ success: false, error: { message: 'Provider not found', statusCode: 404 } });
      return;
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/providers/configs
 * Create a new provider configuration
 */
router.post('/configs', validate(createProviderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await ProviderConfig.findOne({ name: req.body.name });
    if (existing) {
      res.status(409).json({ success: false, error: { message: 'Provider already exists', statusCode: 409 } });
      return;
    }

    const config = await ProviderConfig.create(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/providers/configs/:name
 * Update a provider configuration
 */
router.put('/configs/:name', validate(updateProviderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.params.name).toLowerCase();
    const config = await ProviderConfig.findOneAndUpdate(
      { name },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!config) {
      res.status(404).json({ success: false, error: { message: 'Provider not found', statusCode: 404 } });
      return;
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/providers/configs/:name
 * Delete a provider configuration
 */
router.delete('/configs/:name', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.params.name).toLowerCase();
    const config = await ProviderConfig.findOneAndDelete({ name });
    if (!config) {
      res.status(404).json({ success: false, error: { message: 'Provider not found', statusCode: 404 } });
      return;
    }
    res.json({ success: true, data: { message: 'Provider deleted successfully' } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/providers/configs/:name/keys
 * Add a new API key to a provider (for rotation)
 */
router.post('/configs/:name/keys', validate(addApiKeySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.params.name).toLowerCase();
    const config = await ProviderConfig.findOneAndUpdate(
      { name },
      {
        $push: {
          apiKeys: {
            key: req.body.key,
            isActive: true,
            lastUsed: null,
            failureCount: 0,
          },
        },
      },
      { new: true }
    );
    if (!config) {
      res.status(404).json({ success: false, error: { message: 'Provider not found', statusCode: 404 } });
      return;
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/providers/configs/:name/keys/:keyId
 * Remove a specific API key from a provider
 */
router.delete('/configs/:name/keys/:keyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.params.name).toLowerCase();
    const config = await ProviderConfig.findOneAndUpdate(
      { name },
      { $pull: { apiKeys: { _id: req.params.keyId } as any } },
      { new: true }
    );
    if (!config) {
      res.status(404).json({ success: false, error: { message: 'Provider not found', statusCode: 404 } });
      return;
    }
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/providers/configs/:name/test
 * Test a provider configuration by making a simple API call
 */
router.post('/configs/:name/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.params.name).toLowerCase();
    const config = await ProviderConfig.findOne({ name });
    if (!config) {
      res.status(404).json({ success: false, error: { message: 'Provider not found', statusCode: 404 } });
      return;
    }

    // Try the first active API key
    const activeKey = config.apiKeys.find((k) => k.isActive);
    if (!activeKey) {
      res.status(400).json({ success: false, error: { message: 'No active API keys for this provider', statusCode: 400 } });
      return;
    }

    const startTime = Date.now();
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeKey.key}`,
      },
      body: JSON.stringify({
        model: config.defaultModel || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Respond with only the word: ok' }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(400).json({
        success: false,
        error: { message: `API test failed: ${response.status} ${errorText}`, statusCode: 400 },
      });
      return;
    }

    const latency = Date.now() - startTime;
    res.json({ success: true, data: { latency, message: 'Connection successful' } });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { message: `Connection failed: ${error.message}`, statusCode: 400 },
    });
  }
});

export default router;
