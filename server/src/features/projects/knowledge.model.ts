import mongoose, { Schema } from 'mongoose';

// ─── Knowledge ──────────────────────────────────────────────────────
export interface IKnowledge extends mongoose.Document {
  projectId: string;
  source: string;
  content: string;
  embeddings: number[] | null;
  tags: string[];
  credibilityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeSchema = new Schema<IKnowledge>(
  {
    projectId: { type: String, required: true, index: true },
    source: { type: String, required: true },
    content: { type: String, required: true },
    embeddings: { type: [Number], default: null },
    tags: [{ type: String }],
    credibilityScore: { type: Number, default: 50, min: 0, max: 100 },
  },
  { timestamps: true, collection: 'knowledge' }
);

KnowledgeSchema.index({ projectId: 1, tags: 1 });

export const Knowledge = mongoose.model<IKnowledge>('Knowledge', KnowledgeSchema);

// ─── Document ───────────────────────────────────────────────────────
export interface IDocument extends mongoose.Document {
  projectId: string;
  taskId: string;
  employeeType: string;
  content: string;
  format: string;
  metadata: Record<string, any>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    projectId: { type: String, required: true, index: true },
    taskId: { type: String, required: true },
    employeeType: { type: String, required: true },
    content: { type: String, required: true },
    format: { type: String, default: 'markdown' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    version: { type: Number, default: 1 },
  },
  { timestamps: true, collection: 'documents' }
);

DocumentSchema.index({ taskId: 1 });

export const ContentDocument = mongoose.model<IDocument>('ContentDocument', DocumentSchema);
