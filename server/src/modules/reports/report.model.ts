import { logger } from '../../config/logger';
import { AppError } from '../../utils/helpers';
import { ResearchReport } from './research-report.model';
import { ResearchTask } from '../research/research-task.model';

export class ReportModel {
  static async createReport(
    taskId: string,
    summary: string,
    keyInsights: string[],
    recommendations: string[],
    sources?: any[]
  ) {
    const report = await ResearchReport.create({
      taskId,
      summary,
      keyInsights,
      recommendations,
      sources: sources || [],
    });

    logger.info(`Research report created: ${report._id} for task: ${taskId}`);
    return report;
  }

  static async getReportByTaskId(taskId: string, userId: string) {
    const report = await ResearchReport.findOne({ taskId });
    if (!report) {
      throw new AppError('Report not found for this task', 404);
    }

    // Fetch the task to verify ownership
    const task = await ResearchTask.findById(taskId);
    if (!task || task.userId !== userId) {
      throw new AppError('Unauthorized access to report', 403);
    }

    return {
      id: report._id.toString(),
      taskId: report.taskId,
      topic: task.topic,
      summary: report.summary,
      keyInsights: report.keyInsights,
      recommendations: report.recommendations,
      sources: report.sources,
      createdAt: report.createdAt.toISOString(),
    };
  }
}
