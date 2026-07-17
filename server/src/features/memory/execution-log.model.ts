import mongoose, { Schema, Document } from 'mongoose';

/**
 * ExecutionLog — detailed record of every task execution.
 * Tracks timing, token usage, AI costs, errors, and retries.
 * Used for analytics, cost tracking, and performance monitoring.
 */
export interface IExecutionLog extends Document {
  taskId: string;
  projectId: string;
  userId: string;
  employeeType: string;
  /** Status of this execution */
  status: 'running' | 'completed' | 'failed' | 'retried';
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Token usage (if available from provider) */
  tokensUsed: number;
  /** Estimated cost in USD */
  estimatedCostUsd: number;
  /** Error message if failed */
  error: string | null;
  /** Number of retry attempts */
  retryCount: number;
  /** The provider used (e.g., 'openai', 'gemini') */
  provider: string;
  /** The model used (e.g., 'gpt-4o-mini') */
  usedModel: string;
  /** Additional metadata (input size, output size, etc.) */
  metadata: Record<string, any>;
  createdAt: Date;
}

const ExecutionLogSchema = new Schema<IExecutionLog>(
  {
    taskId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    employeeType: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'retried'],
      required: true,
    },
    durationMs: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 },
    error: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
    provider: { type: String, default: 'unknown' },
    usedModel: { type: String, default: 'unknown' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'execution_logs' }
);

ExecutionLogSchema.index({ projectId: 1, status: 1 });
ExecutionLogSchema.index({ employeeType: 1, createdAt: -1 });
ExecutionLogSchema.index({ createdAt: -1 });

export const ExecutionLog = mongoose.model<IExecutionLog>('ExecutionLog', ExecutionLogSchema);
