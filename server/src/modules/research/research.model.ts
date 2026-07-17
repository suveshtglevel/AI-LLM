import { logger } from '../../config/logger';
import { AppError } from '../../utils/helpers';
import { CreateTaskInput, PaginationQuery, TaskResponse } from '../../types';
import { researchQueue } from '../../queues/research.queue';
import { ResearchTask } from './research-task.model';

function formatTask(task: any): TaskResponse {
  return {
    id: task._id.toString(),
    userId: task.userId,
    topic: task.topic,
    description: task.description || null,
    status: task.status,
    priority: task.priority,
    error: task.error || null,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt?.toISOString() || null,
  };
}

export class ResearchModel {
  static async createTask(userId: string, input: CreateTaskInput): Promise<TaskResponse> {
    const task = await ResearchTask.create({
      userId,
      topic: input.topic,
      description: input.description || null,
      priority: input.priority || 'MEDIUM',
      status: 'PENDING',
    });

    logger.info(`Research task created: ${task._id}`, { userId, topic: input.topic });

    await researchQueue.add('research-task', {
      taskId: task._id.toString(),
      userId,
      topic: input.topic,
      description: input.description,
    });

    logger.info(`Research task queued: ${task._id}`);

    return formatTask(task);
  }

  static async getTasks(userId: string, query: PaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (query.status) {
      filter.status = query.status;
    }

    const [tasks, total] = await Promise.all([
      ResearchTask.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ResearchTask.countDocuments(filter).exec(),
    ]);

    return {
      data: tasks.map((t) => formatTask(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getTask(taskId: string, userId: string): Promise<TaskResponse> {
    const task = await ResearchTask.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    if (task.userId !== userId) {
      throw new AppError('Unauthorized access to task', 403);
    }
    return formatTask(task);
  }

  static async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await ResearchTask.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    if (task.userId !== userId) {
      throw new AppError('Unauthorized access to task', 403);
    }
    await ResearchTask.findByIdAndDelete(taskId);
    logger.info(`Research task deleted: ${taskId}`);
  }

  static async updateTaskStatus(taskId: string, status: string, error?: string): Promise<void> {
    const updateData: any = { status };
    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.completedAt = new Date();
    }
    if (error) {
      updateData.error = error;
    }
    await ResearchTask.findByIdAndUpdate(taskId, updateData);
    logger.info(`Research task status updated: ${taskId} → ${status}`);
  }
}
