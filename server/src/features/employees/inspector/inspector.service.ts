import { logger } from '../../../config/logger';
import { InspectorSnapshot } from './inspector.model';
import { ExecutionLog } from '../../memory/execution-log.model';
import { ActivityLog, EmployeeSession } from '../employee.model';
import { Task } from '../../projects/task.model';
import { emitInspectorUpdate, emitInspectorLog, emitStatusChange, emitPerformanceUpdate } from '../../../socket';

export interface InspectorData {
  employeeType: string;
  status: string;
  currentTask: string | null;
  currentTaskId: string | null;
  currentProjectId: string | null;
  currentGoal: string | null;
  currentReasoning: string | null;
  currentWorkflow: string | null;
  currentStep: string | null;
  currentQueue: string | null;
  currentProvider: string | null;
  currentModel: string | null;
  toolsUsed: string[];
  promptVersion: string | null;
  tokensUsed: number;
  estimatedCost: number;
  executionTime: number;
  retryCount: number;
  memoryUsage: number;
  filesGenerated: string[];
  latestOutput: Record<string, any> | null;
  latestError: string | null;
  healthStatus: string;
  lastExecution: Date | null;
  nextPlannedAction: string | null;
  [key: string]: any;
}

export class InspectorService {
  /**
   * Update the inspector snapshot for an employee and emit socket event.
   */
  static async updateSnapshot(
    employeeType: string,
    data: Partial<InspectorData>
  ): Promise<void> {
    try {
      const snapshot = await InspectorSnapshot.findOneAndUpdate(
        { employeeType },
        {
          $set: {
            ...data,
            timestamp: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      // Emit real-time socket event
      emitInspectorUpdate(employeeType, snapshot);

      // If status changed, emit status event
      if (data.status) {
        emitStatusChange(employeeType, data.status, {
          currentTask: data.currentTask,
          currentTaskId: data.currentTaskId,
        });
      }
    } catch (error) {
      logger.error(`[InspectorService] Failed to update snapshot for ${employeeType}`, error);
    }
  }

  /**
   * Get the full inspector snapshot for an employee.
   * Aggregates live snapshot + recent execution data.
   */
  static async getInspectorData(employeeType: string): Promise<InspectorData | null> {
    try {
      // Get or create the live snapshot
      let snapshot = await InspectorSnapshot.findOne({ employeeType }).lean() as Record<string, any> | null;

      if (!snapshot) {
        // Create a default snapshot
        const created = await InspectorSnapshot.create({
          employeeType,
          status: 'IDLE',
          healthStatus: 'healthy',
          timestamp: new Date(),
        });
        snapshot = created.toObject();
      }

      // Get the latest execution log for enriched metrics
      const latestExecution = await ExecutionLog.findOne({ employeeType })
        .sort({ createdAt: -1 })
        .lean();

      const recentLogs = await ExecutionLog.find({ employeeType })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Compute average metrics from recent logs
      const avgTokens = recentLogs.length > 0
        ? recentLogs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0) / recentLogs.length
        : 0;

      const avgCost = recentLogs.length > 0
        ? recentLogs.reduce((sum, l) => sum + (l.estimatedCostUsd || 0), 0) / recentLogs.length
        : 0;

      const avgDuration = recentLogs.length > 0
        ? recentLogs.reduce((sum, l) => sum + (l.durationMs || 0), 0) / recentLogs.length
        : 0;

      return {
        ...snapshot,
        employeeType: snapshot.employeeType || employeeType,
        // Enrich with latest execution data if snapshot is stale
        currentProvider: snapshot.currentProvider || latestExecution?.provider || null,
        currentModel: snapshot.currentModel || latestExecution?.usedModel || null,
        tokensUsed: snapshot.tokensUsed || avgTokens || 0,
        estimatedCost: snapshot.estimatedCost || avgCost || 0,
        executionTime: snapshot.executionTime || avgDuration || 0,
        retryCount: snapshot.retryCount || 0,
        lastExecution: latestExecution?.createdAt || snapshot.lastExecution || null,
        latestError: snapshot.latestError || latestExecution?.error || null,
      } as InspectorData;
    } catch (error) {
      logger.error(`[InspectorService] Failed to get inspector data for ${employeeType}`, error);
      return null;
    }
  }

  /**
   * Get execution logs for an employee with pagination.
   */
  static async getLogs(
    employeeType: string,
    options: { limit?: number; offset?: number; status?: string } = {}
  ): Promise<{ logs: any[]; total: number }> {
    const { limit = 50, offset = 0, status } = options;
    const filter: any = { employeeType };
    if (status) filter.status = status;

    const [logs, total] = await Promise.all([
      ExecutionLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      ExecutionLog.countDocuments(filter),
    ]);

    return { logs, total };
  }

  /**
   * Get execution history (sessions) for an employee.
   */
  static async getHistory(
    employeeType: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ sessions: any[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    const [sessions, total] = await Promise.all([
      EmployeeSession.find({ employeeType })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      EmployeeSession.countDocuments({ employeeType }),
    ]);

    return { sessions, total };
  }

  /**
   * Get performance metrics for an employee, including chart data.
   */
  static async getPerformance(
    employeeType: string,
    options: { days?: number } = {}
  ): Promise<{
    summary: Record<string, any>;
    executionTrend: any[];
    costTrend: any[];
    tokenTrend: any[];
    statusDistribution: any[];
    recentActivity: any[];
  }> {
    const days = options.days || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get execution logs within the time range
    const executions = await ExecutionLog.find({
      employeeType,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Compute summary
    const totalExecutions = executions.length;
    const completed = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const totalTokens = executions.reduce((sum, e) => sum + (e.tokensUsed || 0), 0);
    const totalCost = executions.reduce((sum, e) => sum + (e.estimatedCostUsd || 0), 0);
    const totalDuration = executions.reduce((sum, e) => sum + (e.durationMs || 0), 0);

    const summary = {
      totalExecutions,
      completed,
      failed,
      successRate: totalExecutions > 0 ? (completed / totalExecutions) * 100 : 0,
      totalTokens,
      totalCost,
      averageDuration: totalExecutions > 0 ? totalDuration / totalExecutions : 0,
      averageTokens: totalExecutions > 0 ? totalTokens / totalExecutions : 0,
      averageCost: totalExecutions > 0 ? totalCost / totalExecutions : 0,
    };

    // Build execution trend (group by day)
    const dailyMap = new Map<string, { count: number; success: number; failed: number; duration: number; tokens: number; cost: number }>();
    
    for (const exec of executions) {
      const date = exec.createdAt ? new Date(exec.createdAt).toISOString().split('T')[0] : 'unknown';
      const entry = dailyMap.get(date) || { count: 0, success: 0, failed: 0, duration: 0, tokens: 0, cost: 0 };
      entry.count++;
      if (exec.status === 'completed') entry.success++;
      if (exec.status === 'failed') entry.failed++;
      entry.duration += exec.durationMs || 0;
      entry.tokens += exec.tokensUsed || 0;
      entry.cost += exec.estimatedCostUsd || 0;
      dailyMap.set(date, entry);
    }

    const executionTrend = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        ...data,
        avgDuration: data.count > 0 ? data.duration / data.count : 0,
      }));

    // Cost and token trends
    const costTrend = executionTrend.map(({ date, cost }) => ({ date, cost: Math.round(cost * 1000000) / 1000000 }));
    const tokenTrend = executionTrend.map(({ date, tokens }) => ({ date, tokens }));

    // Status distribution
    const statusDistribution = [
      { name: 'Completed', value: completed, color: '#22c55e' },
      { name: 'Failed', value: failed, color: '#ef4444' },
      { name: 'Running', value: executions.filter(e => e.status === 'running').length, color: '#3b82f6' },
      { name: 'Retried', value: executions.filter(e => e.status === 'retried').length, color: '#f59e0b' },
    ].filter(s => s.value > 0);

    // Recent activity
    const recentActivity = executions.slice(0, 20).map(e => ({
      _id: e._id,
      taskId: e.taskId,
      status: e.status,
      duration: e.durationMs,
      tokens: e.tokensUsed,
      cost: e.estimatedCostUsd,
      error: e.error,
      createdAt: e.createdAt,
    }));

    return {
      summary,
      executionTrend,
      costTrend,
      tokenTrend,
      statusDistribution,
      recentActivity,
    };
  }

  /**
   * Log an execution event to the activity log and emit socket event.
   */
  static async logActivity(
    employeeType: string,
    data: {
      userId: string;
      projectId?: string;
      taskId?: string;
      action: string;
      status: string;
      duration?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const log = await ActivityLog.create({
        userId: data.userId,
        projectId: data.projectId || null,
        employeeType,
        action: data.action,
        status: data.status,
        duration: data.duration || 0,
        metadata: data.metadata || {},
      });

      // Emit log event via socket
      emitInspectorLog(employeeType, {
        _id: log._id,
        action: log.action,
        status: log.status,
        duration: log.duration,
        metadata: log.metadata,
        createdAt: log.createdAt,
      });

      // Also update the snapshot if this is a status change
      if (['started', 'completed', 'failed'].includes(data.status)) {
        await InspectorService.updateSnapshot(employeeType, {
          status: data.status === 'completed' ? 'IDLE' : data.status === 'failed' ? 'ERROR' : 'BUSY',
          lastExecution: data.status === 'completed' || data.status === 'failed' ? new Date() : undefined,
          latestError: data.status === 'failed' ? data.metadata?.error as string || 'Unknown error' : null,
        });
      }
    } catch (error) {
      logger.error(`[InspectorService] Failed to log activity for ${employeeType}`, error);
    }
  }

  /**
   * Record execution metrics after a task completes (from ExecutionLog record).
   */
  static async recordExecutionMetrics(
    employeeType: string,
    executionLog: any
  ): Promise<void> {
    try {
      const update: Partial<InspectorData> = {
        tokensUsed: executionLog.tokensUsed || 0,
        estimatedCost: executionLog.estimatedCostUsd || 0,
        executionTime: executionLog.durationMs || 0,
        retryCount: executionLog.retryCount || 0,
        currentProvider: executionLog.provider || null,
        currentModel: executionLog.usedModel || null,
        status: executionLog.status === 'completed' ? 'IDLE' : executionLog.status === 'failed' ? 'ERROR' : 'BUSY',
        lastExecution: new Date(),
        latestError: executionLog.error || null,
      };

      await InspectorService.updateSnapshot(employeeType, update);

      // Emit performance update
      emitPerformanceUpdate(employeeType, {
        tokensUsed: executionLog.tokensUsed,
        estimatedCost: executionLog.estimatedCostUsd,
        executionTime: executionLog.durationMs,
        status: executionLog.status,
      });
    } catch (error) {
      logger.error(`[InspectorService] Failed to record execution metrics for ${employeeType}`, error);
    }
  }
}
