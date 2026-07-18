import mongoose, { Schema, Document } from 'mongoose';

/**
 * InspectorSnapshot — real-time snapshot of an employee's state.
 * Updated continuously during execution for the AI Inspector.
 */
export interface IInspectorSnapshot extends Document {
  employeeType: string;
  /** Current status: IDLE | BUSY | ERROR | OFFLINE */
  status: 'IDLE' | 'BUSY' | 'ERROR' | 'OFFLINE';
  /** Current task being executed */
  currentTask: string | null;
  /** Current task ID */
  currentTaskId: string | null;
  /** Current project ID */
  currentProjectId: string | null;
  /** Current goal / objective */
  currentGoal: string | null;
  /** Summary of the employee's reasoning */
  currentReasoning: string | null;
  /** Current workflow name if part of a workflow */
  currentWorkflow: string | null;
  /** Current step in the workflow */
  currentStep: string | null;
  /** Current queue name */
  currentQueue: string | null;
  /** Current AI provider being used */
  currentProvider: string | null;
  /** Current AI model being used */
  currentModel: string | null;
  /** List of tools used in the current execution */
  toolsUsed: string[];
  /** Current prompt version or template */
  promptVersion: string | null;
  /** Total tokens used in current session */
  tokensUsed: number;
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Number of retry attempts */
  retryCount: number;
  /** Memory usage percentage */
  memoryUsage: number;
  /** Files generated during execution */
  filesGenerated: string[];
  /** Latest output data */
  latestOutput: Record<string, any> | null;
  /** Latest error message */
  latestError: string | null;
  /** Health status */
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  /** Last execution timestamp */
  lastExecution: Date | null;
  /** Next planned action */
  nextPlannedAction: string | null;
  /** Additional metadata */
  metadata: Record<string, any>;
  /** Timestamp of this snapshot */
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InspectorSnapshotSchema = new Schema<IInspectorSnapshot>(
  {
    employeeType: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['IDLE', 'BUSY', 'ERROR', 'OFFLINE'],
      default: 'IDLE',
    },
    currentTask: { type: String, default: null },
    currentTaskId: { type: String, default: null },
    currentProjectId: { type: String, default: null },
    currentGoal: { type: String, default: null },
    currentReasoning: { type: String, default: null },
    currentWorkflow: { type: String, default: null },
    currentStep: { type: String, default: null },
    currentQueue: { type: String, default: null },
    currentProvider: { type: String, default: null },
    currentModel: { type: String, default: null },
    toolsUsed: [{ type: String }],
    promptVersion: { type: String, default: null },
    tokensUsed: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    executionTime: { type: Number, default: 0 },
    retryCount: { type: Number, default: 0 },
    memoryUsage: { type: Number, default: 0 },
    filesGenerated: [{ type: String }],
    latestOutput: { type: Schema.Types.Mixed, default: null },
    latestError: { type: String, default: null },
    healthStatus: {
      type: String,
      enum: ['healthy', 'degraded', 'unhealthy'],
      default: 'healthy',
    },
    lastExecution: { type: Date, default: null },
    nextPlannedAction: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'inspector_snapshots' }
);

export const InspectorSnapshot = mongoose.model<IInspectorSnapshot>(
  'InspectorSnapshot',
  InspectorSnapshotSchema
);
