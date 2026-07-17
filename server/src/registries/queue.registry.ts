import { Queue } from 'bullmq';
import { createQueue } from '../queues/queue.service';
import { logger } from '../config/logger';
import { EmployeeRegistry } from './employee.registry';

class QueueRegistryClass {
  private queues = new Map<string, Queue>();

  /**
   * Get or create a queue for an employee type.
   * Queue name is auto-derived: `${employeeType}-task-queue`
   */
  getQueue(employeeType: string): Queue {
    if (!this.queues.has(employeeType)) {
      const queue = createQueue(`${employeeType}-task-queue`);
      this.queues.set(employeeType, queue);
      logger.debug(`[QueueRegistry] Created queue for: ${employeeType}`);
    }
    return this.queues.get(employeeType)!;
  }

  /**
   * Pre-create queues for all registered employees.
   * Call this at startup to ensure all queues are ready.
   */
  initializeAll(): void {
    const employees = EmployeeRegistry.list();
    for (const employee of employees) {
      this.getQueue(employee.type);
    }
    logger.info(`[QueueRegistry] Initialized ${this.queues.size} queues`);
  }

  listQueues(): { type: string; name: string }[] {
    return Array.from(this.queues.entries()).map(([type, queue]) => ({
      type,
      name: queue.name,
    }));
  }

  count(): number {
    return this.queues.size;
  }
}

export const QueueRegistry = new QueueRegistryClass();
