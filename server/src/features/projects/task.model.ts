import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  projectId: string;
  userId: string;
  assignedEmployee: string;
  title: string;
  description: string;
  input: Record<string, any>;
  output: Record<string, any> | null;
  status: 'PENDING' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  error: string | null;
  parentTaskId: string | null;
  dependencies: string[];
  order: number;
  createdAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    assignedEmployee: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    input: { type: Schema.Types.Mixed, default: {} },
    output: { type: Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    error: { type: String, default: null },
    parentTaskId: { type: String, default: null },
    dependencies: [{ type: String }],
    order: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'tasks' }
);

TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assignedEmployee: 1, status: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
