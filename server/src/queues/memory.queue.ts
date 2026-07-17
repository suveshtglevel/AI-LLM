import { createQueue } from './queue.service';
export const memoryQueue = createQueue('memory-task-queue');
