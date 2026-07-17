import { logger } from '../../config/logger';
import { EmployeeSession } from './employee.model';
import { AgentMemory } from '../../modules/memory/memory.model';

export interface EmployeeProfile {
  type: string;
  name: string;
  role: string;
  goal: string;
  instructions: string;
  allowedTools: string[];
  promptTemplate: string;
  model: string;
}

export interface EmployeeTaskInput {
  taskId: string;
  projectId: string;
  userId: string;
  title: string;
  description: string;
  input: Record<string, any>;
  dependencies?: string[];
}

export interface EmployeeResult {
  success: boolean;
  output: Record<string, any> | null;
  error?: string;
  executionTime: number;
}

export abstract class BaseEmployee {
  public readonly profile: EmployeeProfile;

  constructor(profile: EmployeeProfile) {
    this.profile = profile;
  }

  async execute(task: EmployeeTaskInput): Promise<EmployeeResult> {
    const startTime = Date.now();
    const sessionId = `${task.taskId}-${this.profile.type}-${Date.now()}`;

    logger.info(`[${this.profile.name}] Starting execution`, {
      taskId: task.taskId,
      projectId: task.projectId,
    });

    try {
      // 1. Create session
      const session = await EmployeeSession.create({
        taskId: task.taskId,
        employeeType: this.profile.type,
        projectId: task.projectId,
        userId: task.userId,
        status: 'ACTIVE',
        startedAt: new Date(),
      });

      // 2. Load memory
      const memory = await this.loadMemory(task);

      // 3. Execute the specific employee logic
      const output = await this.performWork(task, memory);

      // 4. Save memory
      await this.saveMemory(task, output);

      // 5. Complete session
      session.status = 'COMPLETED';
      session.result = output;
      session.completedAt = new Date();
      await session.save();

      const executionTime = Date.now() - startTime;
      logger.info(`[${this.profile.name}] Completed`, { taskId: task.taskId, executionTime });

      return { success: true, output, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`[${this.profile.name}] Failed`, { taskId: task.taskId, error: message });

      try {
        await EmployeeSession.findOneAndUpdate(
          { taskId: task.taskId, employeeType: this.profile.type },
          { status: 'FAILED', error: message, completedAt: new Date() }
        );
      } catch { /* ignore cleanup errors */ }

      return { success: false, output: null, error: message, executionTime };
    }
  }

  protected abstract performWork(
    task: EmployeeTaskInput,
    memory: any
  ): Promise<Record<string, any>>;

  protected async loadMemory(task: EmployeeTaskInput): Promise<any> {
    try {
      const existing = await AgentMemory.findOne({
        taskId: task.taskId,
        userId: task.userId,
      }).exec();

      if (!existing) {
        return await AgentMemory.create({
          taskId: task.taskId,
          userId: task.userId,
          conversationHistory: [],
          previousResearch: '',
          importantFacts: [],
          learnedPatterns: [],
          metadata: { employeeType: this.profile.type },
        });
      }

      return existing;
    } catch {
      return { conversationHistory: [], importantFacts: [], learnedPatterns: [] };
    }
  }

  protected async saveMemory(task: EmployeeTaskInput, output: Record<string, any>): Promise<void> {
    try {
      await AgentMemory.findOneAndUpdate(
        { taskId: task.taskId, userId: task.userId },
        {
          $push: {
            conversationHistory: {
              role: 'assistant',
              content: JSON.stringify(output).substring(0, 1000),
              timestamp: new Date(),
            },
          },
          $set: { 'metadata.lastOutput': this.profile.type },
        },
        { upsert: true }
      ).exec();
    } catch { /* memory save is non-critical */ }
  }
}
