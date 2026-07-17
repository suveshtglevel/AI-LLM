import mongoose, { Schema, Document } from 'mongoose';

/**
 * LearningMemory — patterns learned from repeated behavior.
 * Stores improvement suggestions for employees, common patterns,
 * and optimization opportunities discovered through execution history.
 */
export interface ILearningMemory extends Document {
  employeeType: string;
  userId: string;
  /** The pattern or lesson learned */
  pattern: string;
  /** Evidence supporting this pattern (past task IDs, examples) */
  evidence: string[];
  /** Confidence 0-100 based on how many times the pattern was observed */
  confidence: number;
  /** Whether this pattern has been applied to improve performance */
  appliedAt: Date | null;
  /** Category: 'optimization' | 'error_pattern' | 'preference' | 'shortcut' */
  category: string;
  /** Impact score: how much this learning improved performance (-100 to 100) */
  impact: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LearningMemorySchema = new Schema<ILearningMemory>(
  {
    employeeType: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    pattern: { type: String, required: true },
    evidence: [{ type: String }],
    confidence: { type: Number, default: 30, min: 0, max: 100 },
    appliedAt: { type: Date, default: null },
    category: {
      type: String,
      enum: ['optimization', 'error_pattern', 'preference', 'shortcut'],
      default: 'optimization',
    },
    impact: { type: Number, default: 0, min: -100, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'learning_memories' }
);

LearningMemorySchema.index({ employeeType: 1, category: 1 });
LearningMemorySchema.index({ confidence: -1 });

export const LearningMemory = mongoose.model<ILearningMemory>('LearningMemory', LearningMemorySchema);
