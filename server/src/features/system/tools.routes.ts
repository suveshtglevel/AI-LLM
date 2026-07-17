import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { ToolRegistry } from '../../registries/tool.registry';

const router = Router();
router.use(authenticate);

/**
 * GET /api/tools
 * List all registered tools
 */
router.get('/', async (_req, res, next) => {
  try {
    const tools = ToolRegistry.list();
    res.json({
      success: true,
      data: {
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          category: t.category,
        })),
        total: tools.length,
      },
    });
  } catch (error) { next(error); }
});

export default router;
