import { createWorker } from '../queues/queue.service';
import { ResearchEmployee } from '../features/employees/research/research.employee';
import { Manager } from '../features/manager/manager.model';
import { ResearchModel } from '../modules/research/research.model';
import { ReportModel } from '../modules/reports/report.model';
import { ResearchAgent } from '../modules/agents/research.agent';
import { logger } from '../config/logger';

const researchEmployee = new ResearchEmployee();
const researchAgent = new ResearchAgent();

export function startResearchWorker(): void {
  createWorker('research-task-queue', async (job) => {
    const { taskId, projectId, userId, topic, description } = job.data;
    logger.info('ResearchWorker: Processing', { taskId, projectId });

    try {
      // AIOS flow (with projectId) — use new employee framework + manager
      if (projectId) {
        const result = await researchEmployee.execute(job.data);
        if (result.success) {
          await Manager.onTaskCompleted(taskId, projectId);
        } else {
          await Manager.onTaskFailed(taskId, projectId, result.error || 'Unknown error');
        }
      } else {
        // Legacy flow (direct API) — use existing models + research agent
        await ResearchModel.updateTaskStatus(taskId, 'RESEARCHING');

        const result = await researchAgent.execute({
          id: taskId,
          userId,
          topic,
          description,
        });

        if (!result.success) {
          throw new Error(result.error || 'Agent execution failed');
        }

        await ResearchModel.updateTaskStatus(taskId, 'ANALYZING');

        if (result.report) {
          await ReportModel.createReport(
            taskId,
            result.report.summary,
            result.report.keyInsights,
            result.report.recommendations
          );
        }

        await ResearchModel.updateTaskStatus(taskId, 'COMPLETED');

        logger.info('ResearchWorker: Legacy flow completed', { taskId, executionTime: result.executionTime });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('ResearchWorker: Failed', { taskId, error: message });
      if (projectId) {
        await Manager.onTaskFailed(taskId, projectId, message);
      } else {
        await ResearchModel.updateTaskStatus(taskId, 'FAILED', message);
      }
    }
  }, 3);
  logger.info('ResearchWorker started');
}
