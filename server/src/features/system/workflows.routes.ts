import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { WorkflowRegistry } from '../../workflows/workflow.registry';

const router = Router();
router.use(authenticate);

/**
 * GET /api/workflows
 * List all registered workflows with step details
 */
router.get('/', async (_req, res, next) => {
  try {
    const workflows = WorkflowRegistry.list();
    res.json({
      success: true,
      data: {
        workflows: workflows.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
          category: w.category,
          version: w.version,
          estimatedDurationMinutes: w.estimatedDurationMinutes,
          tags: w.tags,
          stepCount: w.steps.length,
          steps: w.steps.map(s => ({
            id: s.id,
            employeeType: s.employeeType,
            title: s.title,
            approvalRequired: s.approvalRequired,
            dependsOn: s.dependsOn,
            optional: s.optional,
          })),
        })),
        total: workflows.length,
      },
    });
  } catch (error) { next(error); }
});

export default router;
