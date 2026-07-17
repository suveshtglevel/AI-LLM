import { AgentIdentity, ToolResult } from '../../types';
import { logger } from '../../config/logger';

export interface AgentTask {
  id: string;
  userId: string;
  topic: string;
  description?: string;
}

export interface AgentContext {
  taskId: string;
  userId: string;
  topic: string;
  description?: string;
  memory: {
    conversationHistory: Array<{ role: string; content: string }>;
    previousResearch: string;
    importantFacts: Array<{ fact: string; source: string; confidence: number }>;
  };
  collectedData: Array<{ title: string; content: string; url: string }>;
}

export abstract class BaseAgent {
  public readonly identity: AgentIdentity;

  constructor(identity: AgentIdentity) {
    this.identity = identity;
  }

  /**
   * Main execution pipeline for the agent
   */
  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    logger.info(`Agent "${this.identity.name}" starting execution`, {
      taskId: task.id,
      topic: task.topic,
    });

    try {
      // Phase 1: Initialize context and load memory
      const context = await this.initializeContext(task);
      await this.onPhase('initializing', context);

      // Phase 2: Plan the research
      const researchPlan = await this.plan(context);
      await this.onPhase('planning', context);

      // Phase 3: Collect data (loop through plan)
      for (const step of researchPlan) {
        const results = await this.collectData(context, step);
        context.collectedData.push(...results);
        await this.onPhase('collecting', context, step);
      }

      // Phase 4: Analyze collected information
      const analysis = await this.analyze(context);
      await this.onPhase('analyzing', context);

      // Phase 5: Generate report
      const report = await this.generateReport(context, analysis);
      await this.onPhase('generating_report', context);

      // Phase 6: Save memory
      await this.saveMemory(context);

      const executionTime = Date.now() - startTime;

      logger.info(`Agent "${this.identity.name}" completed execution`, {
        taskId: task.id,
        executionTime: `${executionTime}ms`,
        sourcesCollected: context.collectedData.length,
      });

      return {
        success: true,
        report,
        executionTime,
        sourcesCollected: context.collectedData.length,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error(`Agent "${this.identity.name}" execution failed`, {
        taskId: task.id,
        executionTime: `${executionTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Agent execution failed',
        executionTime,
        sourcesCollected: 0,
      };
    }
  }

  // Abstract methods that each agent must implement
  protected abstract initializeContext(task: AgentTask): Promise<AgentContext>;
  protected abstract plan(context: AgentContext): Promise<string[]>;
  protected abstract collectData(context: AgentContext, step: string): Promise<Array<{ title: string; content: string; url: string }>>;
  protected abstract analyze(context: AgentContext): Promise<string>;
  protected abstract generateReport(context: AgentContext, analysis: string): Promise<{
    summary: string;
    keyInsights: string[];
    recommendations: string[];
  }>;
  protected abstract saveMemory(context: AgentContext): Promise<void>;

  // Hook for logging/tracking phases
  protected async onPhase(phase: string, _context: AgentContext, _step?: string): Promise<void> {
    logger.debug(`Agent "${this.identity.name}" phase: ${phase}`, {
      phase,
      step: _step,
    });
  }

  // Tool execution helper
  protected async executeTool(tool: { execute: (...args: any[]) => Promise<ToolResult> }, ...args: any[]): Promise<ToolResult> {
    return tool.execute(...args);
  }
}

export interface AgentExecutionResult {
  success: boolean;
  report?: {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
  };
  error?: string;
  executionTime: number;
  sourcesCollected: number;
}
