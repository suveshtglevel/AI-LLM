import { Request, Response, NextFunction } from 'express';
import { ResearchModel } from './research.model';
import { sendSuccess } from '../../utils/helpers';

export class ResearchController {
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { topic, description, priority } = req.body;
      const task = await ResearchModel.createTask(req.user!.userId, { topic, description, priority });
      sendSuccess(res, { task }, 201);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page as string | undefined;
      const limit = req.query.limit as string | undefined;
      const status = req.query.status as string | undefined;
      const result = await ResearchModel.getTasks(req.user!.userId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as any,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await ResearchModel.getTask(req.params.id as string, req.user!.userId);
      sendSuccess(res, { task });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ResearchModel.deleteTask(req.params.id as string, req.user!.userId);
      sendSuccess(res, { message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const researchController = new ResearchController();
