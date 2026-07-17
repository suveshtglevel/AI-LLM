import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKeyEntry {
  key: string;
  isActive: boolean;
  lastUsed: Date | null;
  failureCount: number;
}

export interface IProviderConfig extends Document {
  name: string;
  displayName: string;
  /** The provider type identifier used by the AI service to route requests */
  providerType: string;
  apiKeys: IApiKeyEntry[];
  baseUrl: string;
  models: string[];
  defaultModel: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeyEntrySchema = new Schema<IApiKeyEntry>(
  {
    key: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date, default: null },
    failureCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProviderConfigSchema = new Schema<IProviderConfig>(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true },
    providerType: { type: String, required: true },
    apiKeys: { type: [ApiKeyEntrySchema], required: true, validate: [(val: IApiKeyEntry[]) => val.length > 0, 'At least one API key is required'] },
    baseUrl: { type: String, required: true },
    models: { type: [String], default: [] },
    defaultModel: { type: String, default: '' },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'provider_configs' }
);

ProviderConfigSchema.index({ name: 1 }, { unique: true });

export const ProviderConfig = mongoose.model<IProviderConfig>('ProviderConfig', ProviderConfigSchema);
