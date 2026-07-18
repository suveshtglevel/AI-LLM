import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { PlatformConfig, PublishJob, IPlatformCredentials } from './publishing.model';
import { publishingService } from './publishing.service';

const router = Router();
router.use(authenticate);

// ─── Platform config ─────────────────────────────────────────────────

const getUserId = (req: Request): string => {
  if (!req.user) throw new Error('Not authenticated');
  return (req.user as any).userId || (req.user as any).id || req.user;
};

const getUserIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    (req as any).userId = getUserId(req);
    next();
  } catch (e) {
    res.status(401).json({ success: false, error: { message: 'Not authenticated', statusCode: 401 } });
  }
};

router.use(getUserIdMiddleware);

/**
 * GET /api/publishing/config
 * Get platform config for the current user.
 */
router.get('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    let config = await PlatformConfig.findOne({ userId });
    if (!config) {
      config = await PlatformConfig.create({
        userId,
        platforms: [],
        crossPostEnabled: false,
        autoPublishEnabled: false,
        approvalRequired: true,
      });
    }
    // Mask tokens
    const safe = config.toObject();
    for (const p of safe.platforms) {
      if (p.accessToken) p.accessToken = p.accessToken.slice(0, 8) + '...' + p.accessToken.slice(-4);
      if (p.refreshToken) p.refreshToken = p.refreshToken.slice(0, 8) + '...';
    }
    res.json({ success: true, data: safe });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/publishing/config
 * Update or create platform config for the current user
 */
router.put('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const config = await PlatformConfig.findOneAndUpdate(
      { userId },
      { $set: { ...req.body, userId } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/publishing/config/platforms
 * Add or update platform credentials
 */
router.put('/config/platforms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { platform, accountName, accessToken, refreshToken, scopes } = req.body;

    if (!platform || !accountName) {
      res.status(400).json({ success: false, error: { message: 'platform and accountName are required', statusCode: 400 } });
      return;
    }

    let config = await PlatformConfig.findOne({ userId });
    if (!config) {
      config = await PlatformConfig.create({
        userId,
        platforms: [],
        crossPostEnabled: false,
        autoPublishEnabled: false,
        approvalRequired: true,
      });
    }

    const existingIndex = config.platforms.findIndex(p => p.platform === platform);
    const entry: IPlatformCredentials = {
      platform,
      accountName,
      accessToken: accessToken || '',
      refreshToken: refreshToken || undefined,
      scopes: scopes || undefined,
      expiresAt: undefined,
      isActive: true,
      failureCount: 0,
    };

    if (existingIndex >= 0) {
      config.platforms[existingIndex] = { ...config.platforms[existingIndex], ...entry };
    } else {
      config.platforms.push(entry);
    }

    await config.save();
    res.json({ success: true, data: { message: `Platform ${platform} saved successfully` } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/publishing/config/platforms/:platform
 * Remove platform credentials
 */
router.delete('/config/platforms/:platform', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const platform = req.params.platform;
    await PlatformConfig.updateOne(
      { userId },
      { $pull: { platforms: { platform } } }
    );
    res.json({ success: true, data: { message: `Platform ${platform} removed` } });
  } catch (error) {
    next(error);
  }
});

// ─── Publish jobs ────────────────────────────────────────────────────

/**
 * POST /api/publishing/jobs
 * Create a new publish job
 */
router.post('/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { projectId, title, description, content, contentType, fileUrl, filePath, tags, scheduleTime, platforms } = req.body;

    if (!title || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      res.status(400).json({ success: false, error: { message: 'title and platforms (non-empty array) are required', statusCode: 400 } });
      return;
    }

    const job = await PublishJob.create({
      userId,
      projectId: projectId || '',
      taskId: req.body.taskId || '',
      title,
      description: description || '',
      content: content || '',
      contentType: contentType || 'video',
      fileUrl: fileUrl || '',
      filePath: filePath || '',
      tags: tags || [],
      scheduleTime: scheduleTime || null,
      platforms: platforms.map((p: string) => ({
        platform: p,
        status: 'pending',
        retryCount: 0,
      })),
      status: 'queued',
    });

    // If not scheduled and auto publish is on, trigger immediately
    if (!scheduleTime) {
      const config = await PlatformConfig.findOne({ userId });
      if (config && config.autoPublishEnabled && !config.approvalRequired) {
        await publishingService.publishJob(job._id.toString());
      }
    }

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/publishing/jobs
 * List publish jobs with optional status filter
 */
router.get('/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const status = req.query.status as string;
    const projectId = req.query.projectId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const filter: Record<string, any> = { userId };
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;

    const total = await PublishJob.countDocuments(filter);
    const jobs = await PublishJob.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        jobs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/publishing/jobs/:id
 * Get a single publish job
 */
router.get('/jobs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const job = await PublishJob.findOne({ _id: req.params.id, userId });
    if (!job) {
      res.status(404).json({ success: false, error: { message: 'Publish job not found', statusCode: 404 } });
      return;
    }
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/publishing/jobs/:id/publish
 * Trigger publishing for a specific job
 */
router.post('/jobs/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const job = await PublishJob.findOne({ _id: req.params.id, userId });
    if (!job) {
      res.status(404).json({ success: false, error: { message: 'Publish job not found', statusCode: 404 } });
      return;
    }
    if (job.status === 'publishing') {
      res.status(400).json({ success: false, error: { message: 'Job is already publishing', statusCode: 400 } });
      return;
    }

    // Reset failed/pending statuses
    for (const p of job.platforms) {
      if (p.status === 'failed') {
        p.status = 'pending';
        p.errorMessage = undefined;
      }
    }
    job.status = 'queued';
    await job.save();

    // Trigger publishing asynchronously
    const result = await publishingService.publishJob(job._id.toString());
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message, statusCode: 400 } });
  }
});

/**
 * POST /api/publishing/projects/:projectId/publish
 * Publish all queued jobs for a project
 */
router.post('/projects/:projectId/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    const results = await publishingService.publishProject(projectId);
    res.json({ success: true, data: { publishedCount: results.length, results } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message, statusCode: 400 } });
  }
});

export default router;
