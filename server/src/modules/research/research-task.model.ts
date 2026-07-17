import mongoose, { Schema, Document } from 'mongoose';

export interface IResearchTask extends Document {
  userId: string;
  topic: string;
  description?: string | null;
  status: 'PENDING' | 'RESEARCHING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  error?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchTaskSchema = new Schema<IResearchTask>(
  {
    userId: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'RESEARCHING', 'ANALYZING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    error: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'research_tasks',
  }
);

ResearchTaskSchema.index({ userId: 1, createdAt: -1 });
ResearchTaskSchema.index({ status: 1 });

export const ResearchTask = mongoose.model<IResearchTask>('ResearchTask', ResearchTaskSchema);
