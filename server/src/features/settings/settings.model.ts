import mongoose, { Schema, Document } from 'mongoose';

export type ExecutionMode = 'AUTO' | 'MANUAL';

export interface IUserSettings extends Document {
  userId: string;
  executionMode: ExecutionMode;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    executionMode: {
      type: String,
      enum: ['AUTO', 'MANUAL'],
      default: 'AUTO',
    },
  },
  { timestamps: true, collection: 'user_settings' }
);

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
