import mongoose, { Schema, Document } from 'mongoose';

// ─── Employee Profile (configuration) ───────────────────────────────
export interface IEmployeeProfile extends Document {
  type: string;
  name: string;
  role: string;
  goal: string;
  instructions: string;
  allowedTools: string[];
  promptTemplate: string;
  defaultModel: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeProfileSchema = new Schema<IEmployeeProfile>(
  {
    type: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    goal: { type: String, required: true },
    instructions: { type: String, required: true },
    allowedTools: [{ type: String }],
    promptTemplate: { type: String, default: '' },
    defaultModel: { type: String, default: 'gpt-4o-mini' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'employee_profiles' }
);

export const EmployeeProfile = mongoose.model<IEmployeeProfile>('EmployeeProfile', EmployeeProfileSchema);

// ─── Employee Session (runtime instance) ───────────────────────────
export interface IEmployeeSession extends Document {
  taskId: string;
  employeeType: string;
  projectId: string;
  userId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  result: Record<string, any> | null;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSessionSchema = new Schema<IEmployeeSession>(
  {
    taskId: { type: String, required: true, index: true },
    employeeType: { type: String, required: true, index: true },
    projectId: { type: String, required: true },
    userId: { type: String, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'FAILED'],
      default: 'ACTIVE',
    },
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'employee_sessions' }
);

export const EmployeeSession = mongoose.model<IEmployeeSession>('EmployeeSession', EmployeeSessionSchema);

// ─── Activity Log ───────────────────────────────────────────────────
export interface IActivityLog extends Document {
  userId: string;
  projectId: string | null;
  employeeType: string;
  action: string;
  status: string;
  duration: number;
  metadata: Record<string, any>;
  error: string | null;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, default: null },
    employeeType: { type: String, required: true },
    action: { type: String, required: true },
    status: { type: String, required: true },
    duration: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    error: { type: String, default: null },
  },
  { timestamps: true, collection: 'activity_logs' }
);

ActivityLogSchema.index({ projectId: 1, createdAt: -1 });
ActivityLogSchema.index({ employeeType: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
