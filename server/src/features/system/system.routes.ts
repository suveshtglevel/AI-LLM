import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { EmployeeRegistry } from '../../registries/employee.registry';
import { ToolRegistry } from '../../registries/tool.registry';
import { ProviderRegistry } from '../../registries/provider.registry';
import { QueueRegistry } from '../../registries/queue.registry';
import { WorkflowRegistry } from '../../workflows/workflow.registry';
import { DepartmentRegistry } from '../departments/department.registry';

const router = Router();
router.use(authenticate);

/**
 * GET /api/system/status
 * Full system health overview — all component counts
 */
router.get('/status', async (_req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        employees: {
          count: EmployeeRegistry.count(),
          types: EmployeeRegistry.list().map(e => e.type),
        },
        tools: {
          count: ToolRegistry.count(),
          names: ToolRegistry.list().map(t => t.name),
        },
        providers: {
          count: ProviderRegistry.count(),
          configured: ProviderRegistry.listConfigured().map(p => p.name),
          names: ProviderRegistry.list().map(p => p.name),
        },
        queues: {
          count: QueueRegistry.count(),
          queues: QueueRegistry.listQueues(),
        },
        workflows: {
          count: WorkflowRegistry.count(),
          names: WorkflowRegistry.list().map(w => w.name),
        },
        departments: {
          count: DepartmentRegistry.count(),
          names: DepartmentRegistry.list().map(d => d.name),
        },
      },
    });
  } catch (error) { next(error); }
});

export default router;
