import mongoose, { Schema, Document } from 'mongoose';

export interface IUsageRecord extends Document {
  subscription: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  metric: 'api_calls' | 'storage_gb' | 'active_seats' | 'compute_hours' | 'bandwidth_gb';
  quantity: number;
  unit: string;
  unitRate: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  isBilled: boolean;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UsageRecordSchema = new Schema<IUsageRecord>(
  {
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    metric: {
      type: String,
      enum: ['api_calls', 'storage_gb', 'active_seats', 'compute_hours', 'bandwidth_gb'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'count' },
    unitRate: { type: Number, default: 0 },
    billingPeriodStart: { type: Date, required: true },
    billingPeriodEnd: { type: Date, required: true },
    isBilled: { type: Boolean, default: false, index: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UsageRecord = mongoose.model<IUsageRecord>('UsageRecord', UsageRecordSchema);
