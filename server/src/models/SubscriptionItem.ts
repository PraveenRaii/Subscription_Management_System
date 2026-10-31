import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionItem extends Document {
  subscription: mongoose.Types.ObjectId;
  product?: mongoose.Types.ObjectId;
  plan?: mongoose.Types.ObjectId;
  type: 'base_plan' | 'addon' | 'seats' | 'metered_usage';
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionItemSchema = new Schema<ISubscriptionItem>(
  {
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    plan: { type: Schema.Types.ObjectId, ref: 'Plan' },
    type: {
      type: String,
      enum: ['base_plan', 'addon', 'seats', 'metered_usage'],
      default: 'base_plan',
    },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const SubscriptionItem = mongoose.model<ISubscriptionItem>('SubscriptionItem', SubscriptionItemSchema);
