import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  source: 'razorpay' | 'internal' | 'external';
  payload: Record<string, any>;
  status: 'pending' | 'processed' | 'failed';
  attempts: number;
  error?: string;
  headers?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    source: {
      type: String,
      enum: ['razorpay', 'internal', 'external'],
      default: 'razorpay',
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    error: { type: String, default: '' },
    headers: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
