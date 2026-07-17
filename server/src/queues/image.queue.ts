import { createQueue } from './queue.service';
export const imageQueue = createQueue('image-task-queue');
