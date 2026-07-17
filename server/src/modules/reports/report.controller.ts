import { Request, Response, NextFunction } from 'express';
import { ReportModel } from './report.model';
import { sendSuccess } from '../../utils/helpers';

export class ReportController {
  async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await ReportModel.getReportByTaskId(
        req.params.taskId as string,
        req.user!.userId
      );
      sendSuccess(res, { report });
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
