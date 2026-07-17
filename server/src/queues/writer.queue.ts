import { createQueue } from './queue.service';
export const writerQueue = createQueue('writer-task-queue');
