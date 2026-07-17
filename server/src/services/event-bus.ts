import { logger } from '../config/logger';

/**
 * Event types published by the EventBus
 */
export enum TaskEvent {
  TASK_STARTED = 'task:started',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  TASK_APPROVAL_REQUIRED = 'task:approval_required',
  TASK_APPROVED = 'task:approved',
  TASK_REJECTED = 'task:rejected',
  WORKFLOW_STARTED = 'workflow:started',
  WORKFLOW_COMPLETED = 'workflow:completed',
  WORKFLOW_FAILED = 'workflow:failed',
}

export interface TaskEventPayload {
  event: TaskEvent;
  taskId: string;
  projectId: string;
  userId: string;
  employeeType: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

type EventHandler = (payload: TaskEventPayload) => Promise<void> | void;

/**
 * EventBus — lightweight pub/sub for task and workflow events.
 *
 * Employees NEVER call each other directly.
 * Employees publish events via EventBus.
 * Listeners (Manager, WorkflowEngine, Analytics, etc.) react to events.
 *
 * This decouples employees from each other and allows multiple
 * listeners to react to the same event.
 */
class EventBusClass {
  private handlers = new Map<string, Set<EventHandler>>();
  private history: TaskEventPayload[] = [];
  private readonly maxHistory = 100;

  /**
   * Subscribe to an event type.
   * Returns an unsubscribe function.
   */
  on(event: TaskEvent, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Subscribe to ALL events (for monitoring, analytics, logging).
   */
  onAny(handler: EventHandler): () => void {
    return this.on('' as TaskEvent, handler);
  }

  /**
   * Publish an event to all subscribers.
   */
  async publish(event: TaskEvent, payload: Omit<TaskEventPayload, 'event' | 'timestamp'>): Promise<void> {
    const fullPayload: TaskEventPayload = {
      ...payload,
      event,
      timestamp: new Date(),
    };

    // Store in history
    this.history.push(fullPayload);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    logger.debug(`[EventBus] ${event}`, { taskId: payload.taskId, employeeType: payload.employeeType });

    // Notify specific event handlers
    const specificHandlers = this.handlers.get(event);
    if (specificHandlers) {
      const promises: Promise<void>[] = [];
      for (const handler of specificHandlers) {
        try {
          const result = handler(fullPayload);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          logger.error(`[EventBus] Handler error for ${event}`, error);
        }
      }
      await Promise.allSettled(promises);
    }

    // Notify wildcard handlers (onAny)
    const anyHandlers = this.handlers.get('' as TaskEvent);
    if (anyHandlers) {
      const promises: Promise<void>[] = [];
      for (const handler of anyHandlers) {
        try {
          const result = handler(fullPayload);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          logger.error(`[EventBus] Wildcard handler error for ${event}`, error);
        }
      }
      await Promise.allSettled(promises);
    }
  }

  /**
   * Get recent event history for debugging/monitoring.
   */
  getHistory(limit: number = 20): TaskEventPayload[] {
    return this.history.slice(-limit);
  }

  /**
   * Clear all handlers (for testing).
   */
  clear(): void {
    this.handlers.clear();
    this.history = [];
  }

  /**
   * Get the number of registered handlers.
   */
  handlerCount(): number {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.size;
    }
    return count;
  }
}

export const EventBus = new EventBusClass();
