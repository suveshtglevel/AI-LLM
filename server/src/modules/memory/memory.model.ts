import mongoose, { Schema, Document } from 'mongoose';
import { logger } from '../../config/logger';

export interface IAgentMemory extends Document {
  taskId: string;
  userId: string;
  conversationHistory: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  previousResearch: string;
  importantFacts: Array<{
    fact: string;
    source: string;
    confidence: number;
  }>;
  learnedPatterns: Array<{
    pattern: string;
    evidence: string;
  }>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AgentMemorySchema = new Schema<IAgentMemory>(
  {
    taskId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    conversationHistory: [
      {
        role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    previousResearch: { type: String, default: '' },
    importantFacts: [
      {
        fact: { type: String, required: true },
        source: { type: String, default: '' },
        confidence: { type: Number, default: 0, min: 0, max: 100 },
      },
    ],
    learnedPatterns: [
      {
        pattern: { type: String, required: true },
        evidence: { type: String, default: '' },
      },
    ],
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'agent_memories',
  }
);

AgentMemorySchema.index({ taskId: 1, userId: 1 });

const AgentMemoryModel = mongoose.model<IAgentMemory>('AgentMemory', AgentMemorySchema);

// ─── Business Logic (was memory.service.ts) ────────────────────────────────

export class MemoryModel {
  static async getMemory(taskId: string, userId: string): Promise<IAgentMemory | null> {
    try {
      return await AgentMemoryModel.findOne({ taskId, userId }).exec();
    } catch (error) {
      logger.error('Failed to get agent memory:', error);
      throw error;
    }
  }

  static async createMemory(taskId: string, userId: string): Promise<IAgentMemory> {
    try {
      const memory = new AgentMemoryModel({
        taskId,
        userId,
        conversationHistory: [],
        previousResearch: '',
        importantFacts: [],
        learnedPatterns: [],
        metadata: {},
      });
      return await memory.save();
    } catch (error) {
      logger.error('Failed to create agent memory:', error);
      throw error;
    }
  }

  static async updateMemory(
    taskId: string,
    userId: string,
    updates: Partial<IAgentMemory>
  ): Promise<IAgentMemory | null> {
    try {
      return await AgentMemoryModel.findOneAndUpdate(
        { taskId, userId },
        { $set: updates },
        { new: true, upsert: true }
      ).exec();
    } catch (error) {
      logger.error('Failed to update agent memory:', error);
      throw error;
    }
  }

  static async addConversationEntry(
    taskId: string,
    userId: string,
    entry: { role: 'system' | 'user' | 'assistant'; content: string }
  ): Promise<IAgentMemory | null> {
    try {
      return await AgentMemoryModel.findOneAndUpdate(
        { taskId, userId },
        {
          $push: {
            conversationHistory: {
              ...entry,
              timestamp: new Date(),
            },
          },
        },
        { new: true, upsert: true }
      ).exec();
    } catch (error) {
      logger.error('Failed to add conversation entry:', error);
      throw error;
    }
  }

  static async addImportantFact(
    taskId: string,
    userId: string,
    fact: { fact: string; source: string; confidence: number }
  ): Promise<IAgentMemory | null> {
    try {
      return await AgentMemoryModel.findOneAndUpdate(
        { taskId, userId },
        { $push: { importantFacts: fact } },
        { new: true, upsert: true }
      ).exec();
    } catch (error) {
      logger.error('Failed to add important fact:', error);
      throw error;
    }
  }

  static async deleteMemory(taskId: string): Promise<void> {
    try {
      await AgentMemoryModel.deleteMany({ taskId }).exec();
    } catch (error) {
      logger.error('Failed to delete agent memory:', error);
      throw error;
    }
  }
}

// Also export the raw Mongoose model for direct use if needed
export { AgentMemoryModel as AgentMemory };
