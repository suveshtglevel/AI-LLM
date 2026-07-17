import mongoose, { Schema, Document } from 'mongoose';

export interface IResearchReport extends Document {
  taskId: string;
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  sources?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const ResearchReportSchema = new Schema<IResearchReport>(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    summary: { type: String, required: true },
    keyInsights: [{ type: String }],
    recommendations: [{ type: String }],
    sources: { type: [Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,
    collection: 'research_reports',
  }
);

ResearchReportSchema.index({ taskId: 1 });

export const ResearchReport = mongoose.model<IResearchReport>('ResearchReport', ResearchReportSchema);
