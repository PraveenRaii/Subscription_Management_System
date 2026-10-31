import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'billing' | 'subscription' | 'security' | 'renewal' | 'alert' | 'system';
  priority: 'low' | 'normal' | 'high';
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['billing', 'subscription', 'security', 'renewal', 'alert', 'system'],
      default: 'system',
      index: true,
    },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    actionUrl: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
