import { createQueue } from './queue.service';
export const analyticsQueue = createQueue('analytics-task-queue');
