import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { Project } from './project.model';
import { Task } from './task.model';
import { ContentDocument, Knowledge } from './knowledge.model';
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

// ─── Project Output ─────────────────────────────────────────────────

/**
 * GET /api/projects/:id/output
 * Get all tasks with their outputs and content documents for a project.
 * This is how users retrieve the generated content (blogs, scripts, etc.).
 */
router.get('/projects/:id/output', validate(projectIdSchema), async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }

    // Get all tasks for this project, ordered by execution order
    const tasks = await Task.find({ projectId: req.params.id })
      .sort({ order: 1 })
      .lean();

    // Get all content documents for this project
    const documents = await ContentDocument.find({ projectId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    // Get knowledge entries for this project
    const knowledge = await Knowledge.find({ projectId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Structure the output: tasks with their associated documents
    const tasksWithOutput = tasks.map(task => ({
      _id: task._id,
      assignedEmployee: task.assignedEmployee,
      title: task.title,
      description: task.description,
      status: task.status,
      order: task.order,
      input: task.input,
      output: task.output,
      error: task.error,
      startedAt: (task as any).startedAt || task.createdAt,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      // Associate documents for this task
      documents: documents.filter(doc => doc.taskId === task._id.toString()),
    }));

    res.json({
      success: true,
      data: {
        project: {
          _id: project._id,
          title: project.title,
          goal: project.goal,
          status: project.status,
          progress: project.progress,
          workflowType: project.metadata?.workflowType || null,
          createdAt: project.createdAt,
        },
        tasks: tasksWithOutput,
        documents,
        knowledge,
        summary: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
          failedTasks: tasks.filter(t => t.status === 'FAILED').length,
          inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
          totalDocuments: documents.length,
          hasOutput: tasks.some(t => t.output !== null) || documents.length > 0,
        },
      },
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/projects/:id/tasks/:taskId/output
 * Get a single task's detailed output including its content documents.
 */
router.get('/projects/:id/tasks/:taskId/output', validate(projectIdSchema), async (req, res, next) => {
  try {
    const { id, taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, projectId: id, userId: req.user!.userId }).lean();
    if (!task) {
      res.status(404).json({ success: false, error: { message: 'Task not found in this project' } });
      return;
    }

    const documents = await ContentDocument.find({ taskId }).lean();

    res.json({
      success: true,
      data: {
        task,
        documents,
        output: task.output,
        hasContent: documents.length > 0 || task.output !== null,
      },
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/projects/:id/documents
 * Get all content documents for a project (for download/manifest).
 */
router.get('/projects/:id/documents', validate(projectIdSchema), async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!project) {
      res.status(404).json({ success: false, error: { message: 'Project not found' } });
      return;
    }

    const documents = await ContentDocument.find({ projectId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        documents,
        total: documents.length,
      },
    });
  } catch (error) { next(error); }
});

export default router;
