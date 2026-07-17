import mongoose, { Schema, Document } from 'mongoose';

/**
 * ShortMemory — recent task-specific context.
 * Auto-pruned after TTL expires. Used for active task execution context,
 * recent conversations, and temporary state.
 */
export interface IShortMemory extends Document {
  taskId: string;
  userId: string;
  projectId: string;
  /** The employee type that created this memory */
  source: string;
  /** Recent conversation turns (limited to last 20) */
  recentContext: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  /** Temporary working data */
  workingData: Record<string, any>;
  /** Time-to-live in seconds (default: 1 hour) */
  ttlSeconds: number;
  createdAt: Date;
  updatedAt: Date;
  /** Auto-expire index */
  expireAt: Date;
}

const ShortMemorySchema = new Schema<IShortMemory>(
  {
    taskId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    source: { type: String, required: true },
    recentContext: [
      {
        role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    workingData: { type: Schema.Types.Mixed, default: {} },
    ttlSeconds: { type: Number, default: 3600 },
    expireAt: { type: Date, default: () => new Date(Date.now() + 3600 * 1000) },
  },
  { timestamps: true, collection: 'short_memories' }
);

// TTL index for auto-pruning
ShortMemorySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for fast lookups
ShortMemorySchema.index({ taskId: 1, userId: 1 });

export const ShortMemory = mongoose.model<IShortMemory>('ShortMemory', ShortMemorySchema);
