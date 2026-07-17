import mongoose, { Schema, Document } from 'mongoose';

export interface IApproval extends Document {
  projectId: string;
  taskId: string;
  userId: string;
  stepId: string;
  employeeType: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  requestedAt: Date;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    projectId: { type: String, required: true, index: true },
    taskId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    stepId: { type: String, required: true },
    employeeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    comment: { type: String, default: null },
    requestedAt: { type: Date, default: Date.now },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'approvals' }
);

ApprovalSchema.index({ userId: 1, status: 1 });
ApprovalSchema.index({ projectId: 1, status: 1 });

export const Approval = mongoose.model<IApproval>('Approval', ApprovalSchema);
