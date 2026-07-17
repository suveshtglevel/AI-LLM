import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { Project } from './project.model';
import { Task } from './task.model';
import { getProjectsSchema, projectIdSchema, getTasksSchema, taskIdSchema, updateProjectExecutionModeSchema } from './project.validation';
import type { ExecutionMode } from './project.model';

const router = Router();
router.use(authenticate);

// ─── Projects ───────────────────────────────────────────────────────

router.get('/projects', validate(getProjectsSchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;

    const filter: any = { userId: req.user!.userId };
    if (status) filter.status = status;

    const [projects, total] = await Promise.all([
      Project.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      Project.countDocuments(filter).exec(),
    ]);

    res.json({ success: true, data: { data: projects, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/projects/:id', validate(projectIdSchema), async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }
    res.json({ success: true, data: { project } });
  } catch (error) { next(error); }
});

router.delete('/projects/:id', validate(projectIdSchema), async (req, res, next) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    res.json({ success: true, data: { message: 'Project deleted' } });
  } catch (error) { next(error); }
});

/**
 * PATCH /api/projects/:id/execution-mode
 * Override execution mode for a specific project
 */
router.patch('/projects/:id/execution-mode', validate(updateProjectExecutionModeSchema), async (req, res, next) => {
  try {
    const { executionMode } = req.body as { executionMode: ExecutionMode | null };

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { executionMode: executionMode || null },
      { new: true }
    ).exec();

    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }

    res.json({ success: true, data: { project } });
  } catch (error) { next(error); }
});

// ─── Tasks ──────────────────────────────────────────────────────────

router.get('/tasks', validate(getTasksSchema), async (req, res, next) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const status = req.query.status as string | undefined;
    const filter: any = { userId: req.user!.userId };
    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;

    const tasks = await Task.find(filter).sort({ order: 1 }).exec();
    res.json({ success: true, data: { data: tasks, total: tasks.length } });
  } catch (error) { next(error); }
});

router.get('/tasks/:id', validate(taskIdSchema), async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!task) {
      res.status(404).json({ success: false, error: { message: 'Task not found' } });
      return;
    }
    res.json({ success: true, data: { task } });
  } catch (error) { next(error); }
});

export default router;
