import { logger } from '../config/logger';
import { ScheduledJob, IScheduledJob } from '../features/scheduler/scheduler.model';
import { CEO } from '../features/ceo/ceo.model';
import { EventBus, TaskEvent } from './event-bus';

/**
 * Simple cron parser for common schedule patterns.
 * Supports: daily, weekly, monthly, and cron expressions.
 */
function parseCron(cron: string): { type: string; intervalMs: number; description: string } {
  const parts = cron.trim().split(/\s+/);
  if (parts.length === 5) {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Daily at specific hour (e.g., "0 9 * * *" = 9am daily)
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return {
        type: 'daily',
        intervalMs: 24 * 60 * 60 * 1000,
        description: `Daily at ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
      };
    }

    // Weekly on specific day (e.g., "0 9 * * 1" = Monday 9am)
    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIdx = parseInt(dayOfWeek, 10);
      return {
        type: 'weekly',
        intervalMs: 7 * 24 * 60 * 60 * 1000,
        description: `Weekly on ${days[dayIdx] || 'unknown'}`,
      };
    }

    // Monthly on specific day (e.g., "0 9 1 * *" = 1st of month at 9am)
    if (dayOfMonth !== '*' && month === '*') {
      return {
        type: 'monthly',
        intervalMs: 30 * 24 * 60 * 60 * 1000,
        description: `Monthly on day ${dayOfMonth}`,
      };
    }
  }

  // Default: hourly
  return { type: 'hourly', intervalMs: 60 * 60 * 1000, description: 'Every hour' };
}

export class SchedulerService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  /**
   * Start the scheduler — checks every minute for jobs that need to run.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info('[Scheduler] Starting scheduler service');
    this.checkAndRunJobs();

    // Check every 60 seconds
    const interval = setInterval(() => this.checkAndRunJobs(), 60_000);
    this.intervals.set('scheduler-check', interval);

    logger.info('[Scheduler] Scheduler service started (check interval: 60s)');
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    this.isRunning = false;
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      logger.debug(`[Scheduler] Cleared interval: ${name}`);
    }
    this.intervals.clear();
    logger.info('[Scheduler] Scheduler service stopped');
  }

  /**
   * Create a new scheduled job.
   */
  async createJob(params: {
    userId: string;
    name: string;
    description?: string;
    workflowId: string;
    input?: Record<string, any>;
    cronExpression: string;
    scheduleDescription?: string;
  }): Promise<IScheduledJob> {
    const parsed = parseCron(params.cronExpression);
    const now = new Date();

    const job = await ScheduledJob.create({
      userId: params.userId,
      name: params.name,
      description: params.description || '',
      workflowId: params.workflowId,
      input: params.input || {},
      cronExpression: params.cronExpression,
      scheduleDescription: params.scheduleDescription || parsed.description,
      isActive: true,
      lastRunAt: null,
      nextRunAt: new Date(now.getTime() + parsed.intervalMs),
      runCount: 0,
      failCount: 0,
    });

    logger.info(`[Scheduler] Created job: ${params.name} (${params.cronExpression})`);
    return job;
  }

  /**
   * Check all active jobs and run any that are due.
   */
  private async checkAndRunJobs(): Promise<void> {
    try {
      const now = new Date();
      const dueJobs = await ScheduledJob.find({
        isActive: true,
        nextRunAt: { $lte: now },
      }).exec();

      for (const job of dueJobs) {
      this.executeJob(job);
      }
    } catch (error) {
      logger.error('[Scheduler] Error checking jobs:', error);
    }
  }

  /**
   * Execute a single scheduled job.
   */
  private async executeJob(job: any): Promise<void> {
    const startTime = Date.now();
    logger.info(`[Scheduler] Executing job: ${job.name} (workflow: ${job.workflowId})`);

    try {
      // Execute the workflow
      const result = await CEO.delegateGoal(
        job.userId,
        `[Scheduled] ${job.name}`,
        job.input.goal || job.name,
        job.input.description || job.description,
        job.workflowId
      );

      // Update job stats
      const parsed = parseCron(job.cronExpression);
      job.lastRunAt = new Date();
      job.nextRunAt = new Date(Date.now() + parsed.intervalMs);
      job.runCount += 1;
      await job.save();

      await EventBus.publish(TaskEvent.WORKFLOW_STARTED, {
        taskId: job._id.toString(),
        projectId: result.project._id,
        userId: job.userId,
        employeeType: 'scheduler',
        metadata: { jobName: job.name, workflowId: job.workflowId },
      });

      logger.info(`[Scheduler] Job completed: ${job.name} (${Date.now() - startTime}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      job.failCount += 1;
      await job.save();

      logger.error(`[Scheduler] Job failed: ${job.name} — ${message}`);
    }
  }

  /**
   * Pause a scheduled job.
   */
  async pauseJob(jobId: string, userId: string): Promise<void> {
    const result = await ScheduledJob.findOneAndUpdate(
      { _id: jobId, userId },
      { isActive: false },
      { new: true }
    ).exec();

    if (!result) throw new Error('Scheduled job not found');
    logger.info(`[Scheduler] Paused job: ${result.name}`);
  }

  /**
   * Resume a scheduled job.
   */
  async resumeJob(jobId: string, userId: string): Promise<void> {
    const parsed = parseCron((await ScheduledJob.findById(jobId))?.cronExpression || '0 * * * *');
    const result = await ScheduledJob.findOneAndUpdate(
      { _id: jobId, userId },
      {
        isActive: true,
        nextRunAt: new Date(Date.now() + parsed.intervalMs),
      },
      { new: true }
    ).exec();

    if (!result) throw new Error('Scheduled job not found');
    logger.info(`[Scheduler] Resumed job: ${result.name}`);
  }

  /**
   * Delete a scheduled job.
   */
  async deleteJob(jobId: string, userId: string): Promise<void> {
    const result = await ScheduledJob.findOneAndDelete({ _id: jobId, userId }).exec();
    if (!result) throw new Error('Scheduled job not found');
    logger.info(`[Scheduler] Deleted job: ${result.name}`);
  }
}

export const schedulerService = new SchedulerService();
