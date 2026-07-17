import mongoose, { Schema, Document } from 'mongoose';

/**
 * LongMemory — persistent knowledge that survives across sessions.
 * Stores user preferences, verified facts, learned patterns, and reusable insights.
 * This is the system's "long-term memory" — high importance, no TTL.
 */
export interface ILongMemory extends Document {
  userId: string;
  /** Category: 'preference' | 'fact' | 'pattern' | 'insight' | 'reference' */
  category: string;
  key: string;
  value: string;
  /** Source of this memory (which employee/project created it) */
  source: string;
  /** Importance 0-100. Higher = more important, harder to overwrite */
  importance: number;
  /** Confidence 0-100 based on how many times this has been verified */
  confidence: number;
  /** Number of times this memory has been accessed/verified */
  accessCount: number;
  /** Tags for searchability */
  tags: string[];
  /** Whether this memory is active (can be soft-deleted) */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LongMemorySchema = new Schema<ILongMemory>(
  {
    userId: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['preference', 'fact', 'pattern', 'insight', 'reference'],
      required: true,
      index: true,
    },
    key: { type: String, required: true },
    value: { type: String, required: true },
    source: { type: String, default: 'system' },
    importance: { type: Number, default: 50, min: 0, max: 100 },
    confidence: { type: Number, default: 50, min: 0, max: 100 },
    accessCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'long_memories' }
);

LongMemorySchema.index({ userId: 1, category: 1 });
LongMemorySchema.index({ userId: 1, key: 1 }, { unique: true });
LongMemorySchema.index({ tags: 1 });

export const LongMemory = mongoose.model<ILongMemory>('LongMemory', LongMemorySchema);
