import { BaseEmployee, EmployeeTaskInput } from '../base-employee.model';
import { AgentMemory } from '../../../modules/memory/memory.model';
import { Knowledge } from '../../projects/knowledge.model';
import { EmployeeProfile } from '../employee.model';
import { EmployeeRegistry } from '../../../registries/employee.registry';
import { MemoryManager } from '../../../services/memory-manager';
import { ShortMemory } from '../../memory/short-memory.model';

export class MemoryEmployee extends BaseEmployee {
  constructor() {
    super({
      type: 'memory',
      name: 'Memory Employee',
      role: 'Memory & Knowledge Management',
      goal: 'Store long-term memory, project history, learned patterns, and user preferences across all projects',
      instructions: 'Maintain comprehensive memory across sessions. Extract patterns, preferences, and knowledge from completed work.',
      allowedTools: [],
      promptTemplate: 'Store and organize the following information into long-term memory',
      model: 'gpt-4o-mini',
    });
  }

  protected async performWork(task: EmployeeTaskInput, _memory: any): Promise<Record<string, any>> {
    const action = task.input.action || 'store';
    const data = task.input.data || {};
    const projectId = task.projectId;

    switch (action) {
      case 'store':
        return this.storeMemory(task, data);
      case 'recall':
        return this.recallMemory(task);
      case 'smart-recall':
        return this.smartRecall(task);
      case 'summarize':
        return this.summarizeProjectMemory(task);
      case 'cleanup':
        return this.cleanupMemory(task);
      case 'store-long':
        return this.storeLongTerm(task, data);
      case 'store-learning':
        return this.storeLearning(task, data);
      case 'log-execution':
        return this.logExecution(task, data);
      case 'add-history':
        return this.addProjectHistory(task, data);
      default:
        return this.getMemoryStatus(task);
    }
  }

  private async storeMemory(task: EmployeeTaskInput, data: any): Promise<Record<string, any>> {
    const stored: string[] = [];
    const results: Record<string, any> = {};

    // Store in ShortMemory (recent context)
    if (data.context || data.conversation) {
      const shortMem = await MemoryManager.storeShortMemory({
        taskId: task.taskId,
        userId: task.userId,
        projectId: task.projectId,
        source: task.input.employeeType || 'memory',
        context: data.context || data.conversation,
        workingData: data.workingData,
      });
      stored.push('short_memory');
      results.shortMemoryId = shortMem._id;
    }

    // Store in LongMemory (persistent facts/preferences)
    if (data.longTerm) {
      const longMem = await MemoryManager.storeLongMemory({
        userId: task.userId,
        category: data.longTerm.category || 'fact',
        key: data.longTerm.key || `fact-${Date.now()}`,
        value: data.longTerm.value || JSON.stringify(data.longTerm),
        source: task.input.employeeType || 'memory',
        importance: data.longTerm.importance,
        tags: data.longTerm.tags,
      });
      stored.push('long_memory');
      results.longMemoryId = longMem._id;
    }

    // Also store in legacy AgentMemory (backward compat)
    if (data.conversation || data.facts) {
      const memory = await AgentMemory.findOneAndUpdate(
        { taskId: task.taskId, userId: task.userId },
        {
          $push: {
            conversationHistory: data.conversation || [],
            importantFacts: data.facts || [],
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, new: true }
      ).exec();
      stored.push('agent_memory');
      results.agentMemoryId = memory._id;
    }

    // Store in Knowledge
    if (data.knowledge) {
      const doc = await Knowledge.create({
        projectId: task.projectId,
        source: task.input.employeeType || 'memory',
        content: typeof data.knowledge === 'string' ? data.knowledge : JSON.stringify(data.knowledge),
        tags: data.tags || [],
        credibilityScore: data.credibilityScore || 70,
      });
      stored.push('knowledge');
      results.knowledgeId = doc._id;
    }

    // Update EmployeeProfile patterns
    if (data.patterns) {
      await MemoryManager.storeLearning({
        employeeType: task.input.employeeType || 'memory',
        userId: task.userId,
        pattern: data.patterns,
        evidence: [task.taskId],
        category: 'optimization',
      });
      stored.push('learning_memory');

      // Legacy: also update profile
      const profile = await EmployeeProfile.findOne({ type: task.input.employeeType }).exec();
      if (profile) {
        profile.instructions += `\n\nLearned Pattern: ${data.patterns}`;
        await profile.save();
        stored.push('employee_profile');
      }
    }

    return { action: 'stored', stores: stored, results, success: true };
  }

  private async recallMemory(task: EmployeeTaskInput): Promise<Record<string, any>> {
    const query = task.input.query || '';
    const limit = task.input.limit || 10;
    const projectId = task.projectId;

    // Use smart recall — searches all memory stores
    const results = await MemoryManager.smartRecall({
      userId: task.userId,
      projectId,
      taskId: task.taskId,
      query,
      limit,
    });

    return {
      action: 'recalled',
      usingSmartRecall: true,
      shortMemory: results.shortMemory ? {
        contextCount: results.shortMemory.recentContext.length,
        hasWorkingData: Object.keys(results.shortMemory.workingData).length > 0,
      } : null,
      longMemories: results.longMemories.map(m => ({
        key: m.key,
        value: m.value.substring(0, 500),
        category: m.category,
        importance: m.importance,
        confidence: m.confidence,
      })),
      learnings: results.learnings.map(l => ({
        pattern: l.pattern,
        confidence: l.confidence,
        category: l.category,
      })),
      agentMemory: results.agentMemories.map(m => ({
        taskId: m.taskId,
        facts: m.importantFacts,
        patterns: m.learnedPatterns,
        lastUpdated: m.updatedAt,
      })),
      knowledge: results.knowledge.map(k => ({
        content: k.content.substring(0, 500),
        tags: k.tags,
        credibilityScore: k.credibilityScore,
      })),
      totalResults: results.shortMemory ? 1 + results.longMemories.length + results.learnings.length +
        results.agentMemories.length + results.knowledge.length : 0,
    };
  }

  private async smartRecall(task: EmployeeTaskInput): Promise<Record<string, any>> {
    const results = await MemoryManager.smartRecall({
      userId: task.userId,
      projectId: task.projectId,
      taskId: task.taskId,
      query: task.input.query,
      limit: task.input.limit || 20,
    });

    return {
      action: 'smart_recall',
      ...results,
      counts: {
        shortMemory: results.shortMemory ? 1 : 0,
        longMemories: results.longMemories.length,
        learnings: results.learnings.length,
        agentMemories: results.agentMemories.length,
        knowledge: results.knowledge.length,
      },
    };
  }

  private async storeLongTerm(task: EmployeeTaskInput, data: any): Promise<Record<string, any>> {
    const memories: string[] = [];

    for (const item of (Array.isArray(data) ? data : [data])) {
      await MemoryManager.storeLongMemory({
        userId: task.userId,
        category: item.category || 'fact',
        key: item.key || `fact-${Date.now()}`,
        value: item.value || JSON.stringify(item),
        source: task.input.employeeType || 'memory',
        importance: item.importance,
        tags: item.tags,
      });
      memories.push(item.key || item.category);
    }

    return { action: 'stored_long_term', count: memories.length, keys: memories, success: true };
  }

  private async storeLearning(task: EmployeeTaskInput, data: any): Promise<Record<string, any>> {
    const learning = await MemoryManager.storeLearning({
      employeeType: task.input.employeeType || 'memory',
      userId: task.userId,
      pattern: data.pattern || data.patterns || '',
      evidence: data.evidence || [task.taskId],
      category: data.category || 'optimization',
    });

    return {
      action: 'stored_learning',
      pattern: learning.pattern,
      confidence: learning.confidence,
      success: true,
    };
  }

  private async logExecution(task: EmployeeTaskInput, data: any): Promise<Record<string, any>> {
    const log = await MemoryManager.logExecution({
      taskId: task.taskId,
      projectId: task.projectId,
      userId: task.userId,
      employeeType: data.employeeType || task.input.employeeType || 'memory',
      status: data.status || 'completed',
      durationMs: data.durationMs || 0,
      tokensUsed: data.tokensUsed,
      estimatedCostUsd: data.estimatedCostUsd,
      error: data.error,
      retryCount: data.retryCount,
      provider: data.provider,
      usedModel: data.usedModel || data.model,
    });

    return { action: 'logged_execution', logId: log._id, success: true };
  }

  private async addProjectHistory(task: EmployeeTaskInput, data: any): Promise<Record<string, any>> {
    const event = await MemoryManager.addProjectEvent({
      projectId: task.projectId,
      userId: task.userId,
      eventType: data.eventType || 'note',
      title: data.title || 'Memory event',
      description: data.description,
      source: data.source || task.input.employeeType || 'memory',
      taskId: task.taskId,
      metadata: data.metadata,
      importance: data.importance || 'normal',
    });

    return { action: 'added_history', eventId: event._id, success: true };
  }

  private async summarizeProjectMemory(task: EmployeeTaskInput): Promise<Record<string, any>> {
    const projectId = task.projectId;

    const stats = await MemoryManager.getMemoryStats(task.userId);

    const memories = await AgentMemory.find({
      taskId: { $regex: projectId || '', $options: 'i' },
    }).exec();

    const allFacts = memories.flatMap(m => m.importantFacts);
    const allPatterns = memories.flatMap(m => m.learnedPatterns);

    return {
      action: 'summarized',
      projectId,
      memoryStats: {
        shortTerm: stats.short,
        longTerm: stats.long,
        learning: stats.learning,
        executions: stats.execution,
        history: stats.history,
        agentMemory: stats.agentMemory,
        knowledge: stats.knowledge,
      },
      totalAgentEntries: memories.length,
      totalFacts: allFacts.length,
      totalPatterns: allPatterns.length,
      topFacts: allFacts.slice(0, 5),
      topPatterns: allPatterns.slice(0, 5),
      summary: `Project has ${memories.length} agent memory entries, ${stats.long} long-term memories, ` +
        `${stats.learning} learned patterns, and ${stats.knowledge} knowledge entries.`,
    };
  }

  private async cleanupMemory(task: EmployeeTaskInput): Promise<Record<string, any>> {
    const results: Record<string, number> = {};

    // Clean up old short memories (past TTL)
    const beforeShort = await ShortMemory.countDocuments({ userId: task.userId }).exec();
    // Short memory TTL index handles auto-pruning; we just report
    results.shortMemories = beforeShort;

    // Clean up old agent memories (30 days)
    const beforeAgent = await AgentMemory.countDocuments({ userId: task.userId }).exec();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await AgentMemory.updateMany(
      { updatedAt: { $lt: thirtyDaysAgo } },
      { $set: { conversationHistory: [], previousResearch: '' } }
    ).exec();
    results.agentMemoriesBefore = beforeAgent;

    // Archive old execution logs (keep last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const archivedLogs = await ExecutionLog.countDocuments({
      userId: task.userId,
      createdAt: { $lt: ninetyDaysAgo },
    }).exec();
    results.executionLogsArchived = archivedLogs;

    return {
      action: 'cleaned',
      userId: task.userId,
      results,
      message: `Cleaned up memory. ${beforeAgent} agent entries reviewed, ` +
        `${archivedLogs} old execution logs archived.`,
    };
  }

  private async getMemoryStatus(task: EmployeeTaskInput): Promise<Record<string, any>> {
    const stats = await MemoryManager.getMemoryStats(task.userId);

    const totalKnowledge = await Knowledge.countDocuments({
      ...(task.projectId ? { projectId: task.projectId } : {}),
    }).exec();

    return {
      action: 'status',
      userId: task.userId,
      memoryStats: stats,
      totalKnowledgeEntries: totalKnowledge,
      status: 'healthy',
      stores: [
        { name: 'ShortMemory', count: stats.short, ttl: '1 hour auto-prune' },
        { name: 'LongMemory', count: stats.long, ttl: 'permanent' },
        { name: 'LearningMemory', count: stats.learning, ttl: 'permanent' },
        { name: 'ExecutionLog', count: stats.execution, ttl: '90 days' },
        { name: 'ProjectHistory', count: stats.history, ttl: 'permanent' },
        { name: 'AgentMemory (legacy)', count: stats.agentMemory, ttl: '30 days' },
        { name: 'Knowledge', count: totalKnowledge, ttl: 'permanent' },
      ],
    };
  }
}

// Auto-register
import { ExecutionLog } from '../../memory/execution-log.model';

EmployeeRegistry.register({
  type: 'memory',
  name: 'Memory Employee',
  department: 'memory',
  role: 'Memory & Knowledge Management',
  description: 'Store long-term memory, project history, learned patterns, and user preferences',
  skills: ['memory-management', 'knowledge-organization', 'pattern-recognition', 'data-consolidation'],
  allowedTools: [],
  createInstance: () => new MemoryEmployee(),
});
