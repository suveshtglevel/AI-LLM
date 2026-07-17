import mongoose, { Schema, Document } from 'mongoose';

/**
 * ProjectHistory — chronological record of every significant event in a project.
 * Tracks milestones, decisions, task completions, approvals, failures, and changes.
 * Provides a full audit trail for any project.
 */
export interface IProjectHistory extends Document {
  projectId: string;
  userId: string;
  /** Event type: 'created' | 'task_completed' | 'task_failed' | 'milestone' | 'decision' | 'approved' | 'rejected' | 'note' */
  eventType: string;
  /** Title summarizing the event */
  title: string;
  /** Detailed description */
  description: string;
  /** Which employee or system triggered this event */
  source: string;
  /** Related task ID if applicable */
  taskId: string | null;
  /** Additional structured data */
  metadata: Record<string, any>;
  /** Importance level: 'low' | 'normal' | 'high' | 'critical' */
  importance: string;
  createdAt: Date;
}

const ProjectHistorySchema = new Schema<IProjectHistory>(
  {
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    source: { type: String, default: 'system' },
    taskId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    importance: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal',
    },
  },
  { timestamps: true, collection: 'project_history' }
);

ProjectHistorySchema.index({ projectId: 1, createdAt: -1 });
ProjectHistorySchema.index({ projectId: 1, eventType: 1 });

export const ProjectHistory = mongoose.model<IProjectHistory>('ProjectHistory', ProjectHistorySchema);
