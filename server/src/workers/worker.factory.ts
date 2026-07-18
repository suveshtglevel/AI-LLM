import { createWorker } from '../queues/queue.service';
import { QueueRegistry } from '../registries/queue.registry';
import { EmployeeRegistry } from '../registries/employee.registry';
import { Manager } from '../features/manager/manager.model';
import { EventBus, TaskEvent } from '../services/event-bus';
import { logger } from '../config/logger';

/**
 * Types that have dedicated workers with special logic and should NOT be auto-started.
 */
const DEDICATED_WORKER_TYPES = ['research', 'planning'];

/**
 * Start workers for all registered employees EXCEPT those with dedicated workers.
 * Dedicated workers (research, planning) handle their own startup.
 */
export function startAllWorkers(): void {
  const employees = EmployeeRegistry.list();
  let started = 0;

  for (const employee of employees) {
    // Skip types that have dedicated workers with special logic
    if (DEDICATED_WORKER_TYPES.includes(employee.type)) {
      logger.debug(`[WorkerFactory] Skipping ${employee.type} — has dedicated worker`);
      continue;
    }

    const queueName = `${employee.type}-task-queue`;

    createWorker(queueName, async (job) => {
      const { taskId, projectId, userId } = job.data;
      logger.info(`[${employee.name}] Processing task ${taskId}`);

      try {
        // Publish task started event
        await EventBus.publish(TaskEvent.TASK_STARTED, {
          taskId,
          projectId,
          userId: userId || 'system',
          employeeType: employee.type,
        });

        const instance = employee.createInstance();
        const result = await instance.execute(job.data);

        if (result.success) {
          await Manager.onTaskCompleted(taskId, projectId, result.output);
        } else {
          await Manager.onTaskFailed(taskId, projectId, result.error || 'Unknown error');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[${employee.name}] Worker failed`, { taskId, error: message });
        await Manager.onTaskFailed(taskId, projectId, message);
      }
    }, 3);

    started++;
    logger.info(`[WorkerFactory] Started worker for: ${employee.type} (${employee.name})`);
  }

  logger.info(`[WorkerFactory] Started ${started} workers from registry`);
}

/**
 * Start a single employee worker by type.
 * Useful for dedicated workers that have special logic.
 */
export function startEmployeeWorker(employeeType: string): void {
  const employee = EmployeeRegistry.get(employeeType);
  if (!employee) {
    logger.warn(`[WorkerFactory] Cannot start worker — employee type "${employeeType}" not registered`);
    return;
  }

  const queueName = `${employeeType}-task-queue`;

  createWorker(queueName, async (job) => {
    const { taskId, projectId, userId } = job.data;
    logger.info(`[${employee.name}] Processing task ${taskId}`);

    try {
      // Publish task started event
      await EventBus.publish(TaskEvent.TASK_STARTED, {
        taskId,
        projectId,
        userId: userId || 'system',
        employeeType: employee.type,
      });

      const instance = employee.createInstance();
      const result = await instance.execute(job.data);

      if (result.success) {
        await Manager.onTaskCompleted(taskId, projectId, result.output);
      } else {
        await Manager.onTaskFailed(taskId, projectId, result.error || 'Unknown error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[${employee.name}] Worker failed`, { taskId, error: message });
      await Manager.onTaskFailed(taskId, projectId, message);
    }
  }, 3);

  logger.info(`[WorkerFactory] Started dedicated worker for: ${employee.type}`);
}
