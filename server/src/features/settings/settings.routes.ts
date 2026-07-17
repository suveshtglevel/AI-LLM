import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { UserSettings } from './settings.model';
import { updateExecutionModeSchema } from './settings.validation';
import type { ExecutionMode } from './settings.model';

const router = Router();
router.use(authenticate);

/**
 * GET /api/settings/execution-mode
 * Get the current execution mode for the user (returns default if not set)
 */
router.get('/execution-mode', async (req, res, next) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user!.userId }).exec();

    if (!settings) {
      settings = await UserSettings.create({
        userId: req.user!.userId,
        executionMode: 'AUTO' as ExecutionMode,
      });
    }

    res.json({
      success: true,
      data: {
        executionMode: settings.executionMode,
      },
    });
  } catch (error) { next(error); }
});

/**
 * PATCH /api/settings/execution-mode
 * Update the global execution mode (AUTO | MANUAL)
 */
router.patch('/execution-mode', validate(updateExecutionModeSchema), async (req, res, next) => {
  try {
    const { executionMode } = req.body as { executionMode: ExecutionMode };

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user!.userId },
      { executionMode },
      { upsert: true, new: true }
    ).exec();

    res.json({
      success: true,
      data: {
        executionMode: settings.executionMode,
      },
    });
  } catch (error) { next(error); }
});

export default router;
