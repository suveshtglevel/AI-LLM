import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { InspectorService } from './inspector.service';
import { EmployeeRegistry } from '../../../registries/employee.registry';

const router = Router();
router.use(authenticate);

/**
 * GET /api/employees/:type/inspector
 * Get full inspector snapshot for an employee
 */
router.get('/:type/inspector', async (req, res, next) => {
  try {
    const { type } = req.params;

    // Verify employee exists
    const employee = EmployeeRegistry.get(type);
    if (!employee) {
      res.status(404).json({
        success: false,
        error: { message: `Employee type "${type}" not found` },
      });
      return;
    }

    const inspectorData = await InspectorService.getInspectorData(type);

    if (!inspectorData) {
      // Return default data even if no snapshot exists yet
      res.json({
        success: true,
        data: {
          employeeType: type,
          status: 'IDLE',
          currentTask: null,
          currentTaskId: null,
          currentProjectId: null,
          currentGoal: null,
          currentReasoning: null,
          currentWorkflow: null,
          currentStep: null,
          currentQueue: null,
          currentProvider: null,
          currentModel: null,
          toolsUsed: [],
          promptVersion: null,
          tokensUsed: 0,
          estimatedCost: 0,
          executionTime: 0,
          retryCount: 0,
          memoryUsage: 0,
          filesGenerated: [],
          latestOutput: null,
          latestError: null,
          healthStatus: 'healthy',
          lastExecution: null,
          nextPlannedAction: null,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    res.json({ success: true, data: inspectorData });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:type/logs
 * Get execution logs for an employee with pagination
 */
router.get('/:type/logs', async (req, res, next) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    const employee = EmployeeRegistry.get(type);
    if (!employee) {
      res.status(404).json({
        success: false,
        error: { message: `Employee type "${type}" not found` },
      });
      return;
    }

    const result = await InspectorService.getLogs(type, { limit, offset, status });

    res.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:type/history
 * Get execution history (sessions) for an employee
 */
router.get('/:type/history', async (req, res, next) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const employee = EmployeeRegistry.get(type);
    if (!employee) {
      res.status(404).json({
        success: false,
        error: { message: `Employee type "${type}" not found` },
      });
      return;
    }

    const result = await InspectorService.getHistory(type, { limit, offset });

    res.json({
      success: true,
      data: {
        sessions: result.sessions,
        total: result.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/employees/:type/performance
 * Get performance metrics including chart data
 */
router.get('/:type/performance', async (req, res, next) => {
  try {
    const { type } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const employee = EmployeeRegistry.get(type);
    if (!employee) {
      res.status(404).json({
        success: false,
        error: { message: `Employee type "${type}" not found` },
      });
      return;
    }

    const performance = await InspectorService.getPerformance(type, { days });

    res.json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
});

export default router;
