import { logger } from '../config/logger';
import { AgentMemory } from '../modules/memory/memory.model';
import { Knowledge } from '../features/projects/knowledge.model';
import { ShortMemory } from '../features/memory/short-memory.model';
import { LongMemory } from '../features/memory/long-memory.model';
import { LearningMemory } from '../features/memory/learning-memory.model';
import { ExecutionLog } from '../features/memory/execution-log.model';
import { ProjectHistory } from '../features/memory/project-history.model';
export class MemoryManager {
  // ═══════════════════════════════════════════════════
  //  Short Memory — recent context, auto-pruned
  // ═══════════════════════════════════════════════════

  static async storeShortMemory(params: {
    taskId: string;
    userId: string;
    projectId: string;
    source: string;
    context?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    workingData?: Record<string, any>;
    ttlSeconds?: number;
  }): Promise<IShortMemory> {
    const memory = await ShortMemory.findOneAndUpdate(
      { taskId: params.taskId, userId: params.userId },
      {
        $set: {
          projectId: params.projectId,
          source: params.source,
          ttlSeconds: params.ttlSeconds || 3600,
          expireAt: new Date(Date.now() + (params.ttlSeconds || 3600) * 1000),
        },
        $push: {
          recentContext: params.context || [],
        },
        ...(params.workingData ? { $set: { workingData: params.workingData } } : {}),
      },
      { upsert: true, new: true }
    ).exec();

    // Keep only last 20 context entries
    if (memory.recentContext.length > 20) {
      memory.recentContext = memory.recentContext.slice(-20);
      await memory.save();
    }

    return memory;
  }

  static async getShortMemory(taskId: string, userId: string): Promise<IShortMemory | null> {
    return ShortMemory.findOne({ taskId, userId }).exec();
  }

  // ═══════════════════════════════════════════════════
  //  Long Memory — persistent, cross-session
  // ═══════════════════════════════════════════════════

  static async storeLongMemory(params: {
    userId: string;
    category: 'preference' | 'fact' | 'pattern' | 'insight' | 'reference';
    key: string;
    value: string;
    source?: string;
    importance?: number;
    tags?: string[];
  }): Promise<ILongMemory> {
    const existing = await LongMemory.findOne({ userId: params.userId, key: params.key }).exec();

    if (existing) {
      // Update existing — boost confidence if consistent
      existing.value = params.value;
      existing.confidence = Math.min(100, existing.confidence + 5);
      existing.accessCount += 1;
      existing.source = params.source || existing.source;
      if (params.tags) existing.tags = [...new Set([...existing.tags, ...params.tags])];
      await existing.save();
      return existing;
    }

    return LongMemory.create({
      userId: params.userId,
      category: params.category,
      key: params.key,
      value: params.value,
      source: params.source || 'system',
      importance: params.importance || 50,
      confidence: 50,
      accessCount: 1,
      tags: params.tags || [],
    });
  }

  static async getLongMemory(
    userId: string,
    options?: { category?: string; tags?: string[]; limit?: number }
  ): Promise<ILongMemory[]> {
    const filter: any = { userId, isActive: true };
    if (options?.category) filter.category = options.category;
    if (options?.tags) filter.tags = { $in: options.tags };

    return LongMemory.find(filter)
      .sort({ importance: -1, confidence: -1 })
      .limit(options?.limit || 20)
      .exec();
  }

  static async recallLongMemory(userId: string, key: string): Promise<ILongMemory | null> {
    const memory = await LongMemory.findOne({ userId, key, isActive: true }).exec();
    if (memory) {
      memory.accessCount += 1;
      await memory.save();
    }
    return memory;
  }

  // ═══════════════════════════════════════════════════
  //  Learning Memory — patterns and improvements
  // ═══════════════════════════════════════════════════

  static async storeLearning(params: {
    employeeType: string;
    userId: string;
    pattern: string;
    evidence?: string[];
    category?: 'optimization' | 'error_pattern' | 'preference' | 'shortcut';
  }): Promise<ILearningMemory> {
    const existing = await LearningMemory.findOne({
      employeeType: params.employeeType,
      pattern: params.pattern,
    }).exec();

    if (existing) {
      existing.confidence = Math.min(100, existing.confidence + 10);
      existing.evidence = [...new Set([...existing.evidence, ...(params.evidence || [])])];
      await existing.save();
      return existing;
    }

    return LearningMemory.create({
      employeeType: params.employeeType,
      userId: params.userId,
      pattern: params.pattern,
      evidence: params.evidence || [],
      confidence: 30,
      category: params.category || 'optimization',
    });
  }

  static async getLearningForEmployee(
    employeeType: string,
    minConfidence: number = 30
  ): Promise<ILearningMemory[]> {
    return LearningMemory.find({
      employeeType,
      isActive: true,
      confidence: { $gte: minConfidence },
    })
      .sort({ confidence: -1 })
      .limit(10)
      .exec();
  }

  // ═══════════════════════════════════════════════════
  //  Execution Log — detailed execution records
  // ═══════════════════════════════════════════════════

  static async logExecution(params: {
    taskId: string;
    projectId: string;
    userId: string;
    employeeType: string;
    status: 'running' | 'completed' | 'failed' | 'retried';
    durationMs: number;
    tokensUsed?: number;
    estimatedCostUsd?: number;
    error?: string | null;
    retryCount?: number;
    provider?: string;
    usedModel?: string;
    metadata?: Record<string, any>;
  }): Promise<IExecutionLog> {
    return ExecutionLog.create({
      taskId: params.taskId,
      projectId: params.projectId,
      userId: params.userId,
      employeeType: params.employeeType,
      status: params.status,
      durationMs: params.durationMs,
      tokensUsed: params.tokensUsed || 0,
      estimatedCostUsd: params.estimatedCostUsd || 0,
      error: params.error || null,
      retryCount: params.retryCount || 0,
      provider: params.provider || 'unknown',
      usedModel: params.usedModel || 'unknown',
      metadata: params.metadata || {},
    });
  }

  static async getExecutionLogs(
    filter: { projectId?: string; employeeType?: string; userId?: string; limit?: number }
  ): Promise<IExecutionLog[]> {
    const query: any = {};
    if (filter.projectId) query.projectId = filter.projectId;
    if (filter.employeeType) query.employeeType = filter.employeeType;
    if (filter.userId) query.userId = filter.userId;

    return ExecutionLog.find(query)
      .sort({ createdAt: -1 })
      .limit(filter.limit || 50)
      .exec();
  }

  // ═══════════════════════════════════════════════════
  //  Project History — timeline tracking
  // ═══════════════════════════════════════════════════

  static async addProjectEvent(params: {
    projectId: string;
    userId: string;
    eventType: string;
    title: string;
    description?: string;
    source?: string;
    taskId?: string;
    metadata?: Record<string, any>;
    importance?: 'low' | 'normal' | 'high' | 'critical';
  }): Promise<IProjectHistory> {
    return ProjectHistory.create({
      projectId: params.projectId,
      userId: params.userId,
      eventType: params.eventType,
      title: params.title,
      description: params.description || '',
      source: params.source || 'system',
      taskId: params.taskId || null,
      metadata: params.metadata || {},
      importance: params.importance || 'normal',
    });
  }

  static async getProjectHistory(
    projectId: string,
    options?: { eventType?: string; limit?: number }
  ): Promise<IProjectHistory[]> {
    const filter: any = { projectId };
    if (options?.eventType) filter.eventType = options.eventType;

    return ProjectHistory.find(filter)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 100)
      .exec();
  }

  // ═══════════════════════════════════════════════════
  //  Smart Recall — searches all memory stores
  // ═══════════════════════════════════════════════════

  static async smartRecall(params: {
    userId: string;
    projectId?: string;
    taskId?: string;
    query?: string;
    limit?: number;
  }): Promise<{
    shortMemory: IShortMemory | null;
    longMemories: ILongMemory[];
    learnings: ILearningMemory[];
    agentMemories: any[];
    knowledge: any[];
  }> {
    const limit = params.limit || 10;

    // 1. Short memory (most recent, task-specific)
    const shortMemory = params.taskId
      ? await ShortMemory.findOne({ taskId: params.taskId, userId: params.userId }).exec()
      : null;

    // 2. Long memory (persistent preferences and facts)
    const longMemories = await LongMemory.find({
      userId: params.userId,
      isActive: true,
      ...(params.query ? { tags: { $in: [params.query] } } : {}),
    })
      .sort({ importance: -1 })
      .limit(limit)
      .exec();

    // 3. Learning memory (patterns)
    const learnings = await LearningMemory.find({
      userId: params.userId,
      isActive: true,
    })
      .sort({ confidence: -1 })
      .limit(limit)
      .exec();

    // 4. Legacy AgentMemory (backward compat)
    const agentMemories = await AgentMemory.find({
      userId: params.userId,
      ...(params.taskId ? { taskId: params.taskId } : {}),
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    // 5. Knowledge base
    const knowledge = await Knowledge.find({
      ...(params.projectId ? { projectId: params.projectId } : {}),
    })
      .sort({ credibilityScore: -1 })
      .limit(limit)
      .exec();

    return { shortMemory, longMemories, learnings, agentMemories, knowledge };
  }

  // ═══════════════════════════════════════════════════
  //  Memory Status / Statistics
  // ═══════════════════════════════════════════════════

  static async getMemoryStats(userId?: string): Promise<{
    short: number;
    long: number;
    learning: number;
    execution: number;
    history: number;
    agentMemory: number;
    knowledge: number;
  }> {
    const filter = userId ? { userId } : {};

    const [
      shortCount,
      longCount,
      learningCount,
      executionCount,
      historyCount,
      agentCount,
      knowledgeCount,
    ] = await Promise.all([
      ShortMemory.countDocuments(filter).exec(),
      LongMemory.countDocuments({ ...filter, isActive: true }).exec(),
      LearningMemory.countDocuments({ ...filter, isActive: true }).exec(),
      ExecutionLog.countDocuments(filter).exec(),
      ProjectHistory.countDocuments(filter).exec(),
      AgentMemory.countDocuments(filter).exec(),
      Knowledge.countDocuments(filter).exec(),
    ]);

    return {
      short: shortCount,
      long: longCount,
      learning: learningCount,
      execution: executionCount,
      history: historyCount,
      agentMemory: agentCount,
      knowledge: knowledgeCount,
    };
  }
}

// Import for type usage
import { IShortMemory } from '../features/memory/short-memory.model';
import { ILongMemory } from '../features/memory/long-memory.model';
import { ILearningMemory } from '../features/memory/learning-memory.model';
import { IExecutionLog } from '../features/memory/execution-log.model';
import { IProjectHistory } from '../features/memory/project-history.model';
