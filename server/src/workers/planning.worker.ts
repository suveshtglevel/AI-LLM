import { createWorker } from '../queues/queue.service';
import { PlanningEmployee } from '../features/employees/planning/planning.employee';
import { Manager } from '../features/manager/manager.model';
import { logger } from '../config/logger';

const planning = new PlanningEmployee();

export function startPlanningWorker(): void {
  createWorker('planning-task-queue', async (job) => {
    const { taskId, projectId, userId } = job.data;
    logger.info('PlanningWorker: Processing', { taskId, projectId });
    const result = await planning.execute(job.data);
    if (result.success) {
      await Manager.processPlan(taskId, projectId, userId, result.output || {});
      await Manager.onTaskCompleted(taskId, projectId);
    } else {
      await Manager.onTaskFailed(taskId, projectId, result.error || 'Unknown error');
    }
  }, 2);
  logger.info('PlanningWorker started');
}
