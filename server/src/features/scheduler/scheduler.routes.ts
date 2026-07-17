import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { ScheduledJob } from './scheduler.model';
import { schedulerService } from '../../services/scheduler.service';
import { createJobSchema, jobIdSchema, listJobsSchema } from './scheduler.validation';

function getJobId(req: any): string {
  return req.params.id as string;
}

const router = Router();
router.use(authenticate);

/**
 * GET /api/scheduler
 * List all scheduled jobs for the user
 */
router.get('/', validate(listJobsSchema), async (req, res, next) => {
  try {
    const isActive = req.query.isActive;
    const limit = Number(req.query.limit) || 20;

    const filter: any = { userId: req.user!.userId };
    if (isActive === 'true') filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;

    const [jobs, total] = await Promise.all([
      ScheduledJob.find(filter).sort({ createdAt: -1 }).limit(limit).exec(),
      ScheduledJob.countDocuments(filter).exec(),
    ]);

    res.json({ success: true, data: { jobs, total } });
  } catch (error) { next(error); }
});

/**
 * POST /api/scheduler
 * Create a new scheduled job
 */
router.post('/', validate(createJobSchema), async (req, res, next) => {
  try {
    const job = await schedulerService.createJob({
      userId: req.user!.userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: job });
  } catch (error) { next(error); }
});

/**
 * GET /api/scheduler/:id
 * Get a specific scheduled job
 */
router.get('/:id', validate(jobIdSchema), async (req, res, next) => {
  try {
    const id = getJobId(req);
    const job = await ScheduledJob.findOne({ _id: id, userId: req.user!.userId }).exec();
    if (!job) {
      res.status(404).json({ success: false, error: { message: 'Scheduled job not found' } });
      return;
    }
    res.json({ success: true, data: job });
  } catch (error) { next(error); }
});

/**
 * POST /api/scheduler/:id/pause
 * Pause a scheduled job
 */
router.post('/:id/pause', validate(jobIdSchema), async (req, res, next) => {
  try {
    await schedulerService.pauseJob(getJobId(req), req.user!.userId);
    res.json({ success: true, data: { message: 'Job paused' } });
  } catch (error) { next(error); }
});

/**
 * POST /api/scheduler/:id/resume
 * Resume a scheduled job
 */
router.post('/:id/resume', validate(jobIdSchema), async (req, res, next) => {
  try {
    await schedulerService.resumeJob(getJobId(req), req.user!.userId);
    res.json({ success: true, data: { message: 'Job resumed' } });
  } catch (error) { next(error); }
});

/**
 * DELETE /api/scheduler/:id
 * Delete a scheduled job
 */
router.delete('/:id', validate(jobIdSchema), async (req, res, next) => {
  try {
    await schedulerService.deleteJob(getJobId(req), req.user!.userId);
    res.json({ success: true, data: { message: 'Job deleted' } });
  } catch (error) { next(error); }
});

export default router;
