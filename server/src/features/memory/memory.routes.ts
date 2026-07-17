import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { MemoryManager } from '../../services/memory-manager';
import { LongMemory } from './long-memory.model';
import { LearningMemory } from './learning-memory.model';
import { ExecutionLog } from './execution-log.model';
import { ProjectHistory } from './project-history.model';

const router = Router();
router.use(authenticate);

/**
 * GET /api/memory/status
 * Get memory statistics for the current user
 */
router.get('/status', async (req, res, next) => {
  try {
    const stats = await MemoryManager.getMemoryStats(req.user!.userId);
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
});

/**
 * GET /api/memory/long
 * List long-term memories
 */
router.get('/long', async (req, res, next) => {
  try {
    const { category, limit } = req.query as { category?: string; limit?: string };
    const memories = await MemoryManager.getLongMemory(req.user!.userId, {
      category,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    res.json({ success: true, data: { memories, total: memories.length } });
  } catch (error) { next(error); }
});

/**
 * POST /api/memory/long
 * Store a long-term memory
 */
router.post('/long', async (req, res, next) => {
  try {
    const { category, key, value, source, importance, tags } = req.body;
    const memory = await MemoryManager.storeLongMemory({
      userId: req.user!.userId,
      category,
      key,
      value,
      source,
      importance,
      tags,
    });
    res.status(201).json({ success: true, data: memory });
  } catch (error) { next(error); }
});

/**
 * GET /api/memory/long/:key
 * Recall a specific long-term memory by key
 */
router.get('/long/:key', async (req, res, next) => {
  try {
    const memory = await MemoryManager.recallLongMemory(req.user!.userId, req.params.key);
    if (!memory) {
      res.status(404).json({ success: false, error: { message: 'Memory not found' } });
      return;
    }
    res.json({ success: true, data: memory });
  } catch (error) { next(error); }
});

/**
 * GET /api/memory/learning
 * Get learning memories
 */
router.get('/learning', async (req, res, next) => {
  try {
    const { employeeType, minConfidence } = req.query as { employeeType?: string; minConfidence?: string };
    let learnings;
    if (employeeType) {
      learnings = await MemoryManager.getLearningForEmployee(employeeType, parseInt(minConfidence || '30', 10));
    } else {
      learnings = await LearningMemory.find({ userId: req.user!.userId, isActive: true })
        .sort({ confidence: -1 })
        .limit(20)
        .exec();
    }
    res.json({ success: true, data: { learnings, total: learnings.length } });
  } catch (error) { next(error); }
});

/**
 * GET /api/memory/executions
 * Get execution logs
 */
router.get('/executions', async (req, res, next) => {
  try {
    const { projectId, employeeType, limit } = req.query as {
      projectId?: string;
      employeeType?: string;
      limit?: string;
    };
    const logs = await MemoryManager.getExecutionLogs({
      projectId,
      employeeType,
      userId: req.user!.userId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    res.json({ success: true, data: { logs, total: logs.length } });
  } catch (error) { next(error); }
});

/**
 * GET /api/memory/history/:projectId
 * Get project history timeline
 */
router.get('/history/:projectId', async (req, res, next) => {
  try {
    const { eventType, limit } = req.query as { eventType?: string; limit?: string };
    const history = await MemoryManager.getProjectHistory(req.params.projectId, {
      eventType,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    res.json({ success: true, data: { history, total: history.length } });
  } catch (error) { next(error); }
});

/**
 * POST /api/memory/history/:projectId
 * Add an event to project history
 */
router.post('/history/:projectId', async (req, res, next) => {
  try {
    const { eventType, title, description, source, taskId, metadata, importance } = req.body;
    const event = await MemoryManager.addProjectEvent({
      projectId: req.params.projectId,
      userId: req.user!.userId,
      eventType,
      title,
      description,
      source,
      taskId,
      metadata,
      importance,
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
});

/**
 * GET /api/memory/search
 * Smart search across all memory stores
 */
router.get('/search', async (req, res, next) => {
  try {
    const { projectId, taskId, query, limit } = req.query as {
      projectId?: string;
      taskId?: string;
      query?: string;
      limit?: string;
    };
    const results = await MemoryManager.smartRecall({
      userId: req.user!.userId,
      projectId,
      taskId,
      query,
      limit: limit ? parseInt(limit, 10) : 10,
    });
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
});

export default router;
