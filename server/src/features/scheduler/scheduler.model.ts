import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledJob extends Document {
  userId: string;
  name: string;
  description: string;
  /** Workflow ID to execute */
  workflowId: string;
  /** User input to pass to the workflow */
  input: Record<string, any>;
  /** Cron expression (e.g., '0 9 * * 1-5' for weekdays at 9am) */
  cronExpression: string;
  /** Human-readable schedule description */
  scheduleDescription: string;
  /** Status */
  isActive: boolean;
  /** Last execution timestamp */
  lastRunAt: Date | null;
  /** Next scheduled execution */
  nextRunAt: Date | null;
  /** Total successful runs */
  runCount: number;
  /** Total failed runs */
  failCount: number;
  /** When this schedule was created */
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledJobSchema = new Schema<IScheduledJob>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    workflowId: { type: String, required: true },
    input: { type: Schema.Types.Mixed, default: {} },
    cronExpression: { type: String, required: true },
    scheduleDescription: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastRunAt: { type: Date, default: null },
    nextRunAt: { type: Date, default: null },
    runCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'scheduled_jobs' }
);

ScheduledJobSchema.index({ userId: 1, isActive: 1 });
ScheduledJobSchema.index({ nextRunAt: 1 });

export const ScheduledJob = mongoose.model<IScheduledJob>('ScheduledJob', ScheduledJobSchema);
