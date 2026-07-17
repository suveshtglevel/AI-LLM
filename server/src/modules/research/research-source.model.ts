import mongoose, { Schema, Document } from 'mongoose';

export interface IResearchSource extends Document {
  taskId: string;
  url: string;
  title: string;
  content: string;
  extractedData: {
    headings: string[];
    paragraphs: string[];
    keyTerms: string[];
    links: string[];
  };
  metadata: {
    domain: string;
    author: string | null;
    publishDate: string | null;
    wordCount: number;
  };
  credibilityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchSourceSchema = new Schema<IResearchSource>(
  {
    taskId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    extractedData: {
      headings: [{ type: String }],
      paragraphs: [{ type: String }],
      keyTerms: [{ type: String }],
      links: [{ type: String }],
    },
    metadata: {
      domain: { type: String, default: '' },
      author: { type: String, default: null },
      publishDate: { type: String, default: null },
      wordCount: { type: Number, default: 0 },
    },
    credibilityScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    collection: 'research_sources',
  }
);

ResearchSourceSchema.index({ taskId: 1, url: 1 });

export const ResearchSource = mongoose.model<IResearchSource>('ResearchSource', ResearchSourceSchema);
