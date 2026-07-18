import mongoose, { Schema, Document } from 'mongoose';

// ─── Platform Credentials ────────────────────────────────────────────

export interface IPlatformCredentials {
  platform: string;          // 'youtube' | 'instagram' | 'tiktok' | 'x' | 'linkedin'
  accountName: string;       // Display name (e.g., "My Channel")
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
  isActive: boolean;
  failureCount: number;
}

const PlatformCredentialsSchema = new Schema<IPlatformCredentials>({
  platform: { type: String, required: true },
  accountName: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: String,
  expiresAt: Date,
  scopes: [String],
  isActive: { type: Boolean, default: true },
  failureCount: { type: Number, default: 0 },
}, { _id: false });

// ─── Platform Config ────────────────────────────────────────────────

export interface IPlatformConfig extends Document {
  userId: string;
  platforms: IPlatformCredentials[];
  youtubeChannelId?: string;
  instagramBusinessId?: string;
  defaultVisibility?: string;        // 'public' | 'unlisted' | 'private'
  crossPostEnabled: boolean;
  autoPublishEnabled: boolean;
  approvalRequired: boolean;
  created_At: Date;
  updated_At: Date;
}

const PlatformConfigSchema = new Schema<IPlatformConfig>({
  userId: { type: String, required: true, index: true },
  platforms: [PlatformCredentialsSchema],
  youtubeChannelId: String,
  instagramBusinessId: String,
  defaultVisibility: { type: String, default: 'public' },
  crossPostEnabled: { type: Boolean, default: false },
  autoPublishEnabled: { type: Boolean, default: false },
  approvalRequired: { type: Boolean, default: true },
}, { timestamps: true, collection: 'platform_configs' });

// ─── Publish Queue ──────────────────────────────────────────────────

export interface IPublishStatus {
  platform: string;
  status: string;          // 'pending' | 'publishing' | 'published' | 'failed'
  externalId?: string;     // Video/Post ID returned by the platform
  externalUrl?: string;    // URL to the published content
  errorMessage?: string;
  publishedAt?: Date;
  retryCount: number;
  lastRetry: Date;
}

const PublishStatusSchema = new Schema<IPublishStatus>({
  platform: { type: String, required: true },
  status: { type: String, default: 'pending', index: true },
  externalId: String,
  externalUrl: String,
  errorMessage: String,
  publishedAt: Date,
  retryCount: { type: Number, default: 0 },
  lastRetry: { type: Date, default: Date.now },
}, { _id: false });

// ─── Publish Job ────────────────────────────────────────────────────

export interface IPublishJob extends Document {
  userId: string;
  projectId: string;
  taskId: string;
  title: string;
  description: string;
  content: string;
  contentType: string;           // 'video' | 'image' | 'text' | 'audio'
  filePath: string;              // local path or url to the media file
  fileUrl: string;
  tags: string[];
  scheduleTime: Date;
  platforms: IPublishStatus[];
  status: string;                // 'queued' | 'publishing' | 'completed' | 'partially_completed' | 'failed'
  created_At: Date;
  updated_At: Date;
}

const PublishJobSchema = new Schema<IPublishJob>({
  userId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  taskId: { type: String, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  contentType: { type: String, default: 'video' },
  filePath: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  tags: { type: [String], default: [] },
  scheduleTime: { type: Date, default: null },
  platforms: { type: [PublishStatusSchema], default: [] },
  status: { type: String, default: 'queued', index: true },
}, { timestamps: true, collection: 'publish_jobs' });

export const PlatformConfig = mongoose.model<IPlatformConfig>(
  'PlatformConfig', PlatformConfigSchema
);

export const PublishJob = mongoose.model<IPublishJob>(
  'PublishJob', PublishJobSchema
);
