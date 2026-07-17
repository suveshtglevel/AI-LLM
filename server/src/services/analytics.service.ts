import { logger } from '../config/logger';
import { ExecutionLog } from '../features/memory/execution-log.model';
import { ActivityLog } from '../features/employees/employee.model';
import { Task } from '../features/projects/task.model';
import { Project } from '../features/projects/project.model';

export interface AnalyticsSummary {
  tasks: {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  };
  executions: {
    total: number;
    totalDurationMs: number;
    avgDurationMs: number;
    totalTokens: number;
    totalCostUsd: number;
  };
  projects: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
  errors: {
    total: number;
    topErrors: Array<{ error: string; count: number }>;
  };
}

export interface EmployeePerformance {
  employeeType: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgDurationMs: number;
  completionRate: number;
  totalTokens: number;
  totalCostUsd: number;
}

export class AnalyticsService {
  /**
   * Get full analytics summary for a user.
   */
  static async getSummary(userId: string): Promise<AnalyticsSummary> {
    const [taskStats, executionStats, projectStats, errorStats] = await Promise.all([
      this.getTaskStats(userId),
      this.getExecutionStats(userId),
      this.getProjectStats(userId),
      this.getErrorStats(userId),
    ]);

    return {
      tasks: taskStats,
      executions: executionStats,
      projects: projectStats,
      errors: errorStats,
    };
  }

  /**
   * Get performance breakdown by employee type.
   */
  static async getEmployeePerformance(userId: string): Promise<EmployeePerformance[]> {
    const executions = await ExecutionLog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$employeeType',
          totalExecutions: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          totalDuration: { $sum: '$durationMs' },
          avgDuration: { $avg: '$durationMs' },
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$estimatedCostUsd' },
        },
      },
      { $sort: { totalExecutions: -1 } },
    ]).exec();

    const tasksByEmployee = await ActivityLog.aggregate([
      { $match: { userId, action: 'skill_assigned' } },
      { $group: { _id: '$employeeType', count: { $sum: 1 } } },
    ]).exec();

    const taskCountMap = new Map(tasksByEmployee.map(t => [t._id, t.count]));

    return executions.map(e => ({
      employeeType: e._id,
      totalTasks: taskCountMap.get(e._id) || e.totalExecutions,
      completedTasks: e.completedCount,
      failedTasks: e.failedCount,
      avgDurationMs: Math.round(e.avgDuration),
      completionRate: e.totalExecutions > 0 ? Math.round((e.completedCount / e.totalExecutions) * 100) : 0,
      totalTokens: e.totalTokens,
      totalCostUsd: Math.round(e.totalCost * 10000) / 10000,
    }));
  }

  /**
   * Get cost trends over time (daily).
   */
  static async getCostTrends(userId: string, days: number = 30): Promise<Array<{ date: string; cost: number; tokens: number; executions: number }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await ExecutionLog.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cost: { $sum: '$estimatedCostUsd' },
          tokens: { $sum: '$tokensUsed' },
          executions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    return trends.map(t => ({
      date: t._id,
      cost: Math.round(t.cost * 10000) / 10000,
      tokens: t.tokens,
      executions: t.executions,
    }));
  }

  /**
   * Get execution time trends (hourly buckets).
   */
  static async getPerformanceTrends(userId: string, days: number = 7): Promise<Array<{ date: string; avgDurationMs: number; successRate: number; totalJobs: number }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await ExecutionLog.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgDuration: { $avg: '$durationMs' },
          completedJobs: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalJobs: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    return trends.map(t => ({
      date: t._id,
      avgDurationMs: Math.round(t.avgDuration),
      successRate: t.totalJobs > 0 ? Math.round((t.completedJobs / t.totalJobs) * 100) : 0,
      totalJobs: t.totalJobs,
    }));
  }

  // ─── Private helpers ──────────────────────────────────

  private static async getTaskStats(userId: string) {
    const [total, completed, failed, inProgress, pending] = await Promise.all([
      Task.countDocuments({ userId }).exec(),
      Task.countDocuments({ userId, status: 'COMPLETED' }).exec(),
      Task.countDocuments({ userId, status: 'FAILED' }).exec(),
      Task.countDocuments({ userId, status: 'IN_PROGRESS' }).exec(),
      Task.countDocuments({ userId, status: { $in: ['PENDING', 'QUEUED'] } }).exec(),
    ]);

    return {
      total,
      completed,
      failed,
      inProgress,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  private static async getExecutionStats(userId: string) {
    const stats = await ExecutionLog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalDuration: { $sum: '$durationMs' },
          avgDuration: { $avg: '$durationMs' },
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$estimatedCostUsd' },
        },
      },
    ]).exec();

    if (stats.length === 0) {
      return { total: 0, totalDurationMs: 0, avgDurationMs: 0, totalTokens: 0, totalCostUsd: 0 };
    }

    return {
      total: stats[0].total,
      totalDurationMs: stats[0].totalDuration,
      avgDurationMs: Math.round(stats[0].avgDuration),
      totalTokens: stats[0].totalTokens,
      totalCostUsd: Math.round(stats[0].totalCost * 10000) / 10000,
    };
  }

  private static async getProjectStats(userId: string) {
    const [total, completed, inProgress, failed] = await Promise.all([
      Project.countDocuments({ userId }).exec(),
      Project.countDocuments({ userId, status: 'COMPLETED' }).exec(),
      Project.countDocuments({ userId, status: 'IN_PROGRESS' }).exec(),
      Project.countDocuments({ userId, status: 'FAILED' }).exec(),
    ]);

    return { total, completed, inProgress, failed };
  }

  private static async getErrorStats(userId: string) {
    const topErrors = await ExecutionLog.aggregate([
      { $match: { userId, status: 'failed', error: { $ne: null } } },
      { $group: { _id: '$error', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).exec();

    return {
      total: topErrors.reduce((sum: number, e: any) => sum + e.count, 0),
      topErrors: topErrors.map((e: any) => ({ error: e._id, count: e.count })),
    };
  }
}
