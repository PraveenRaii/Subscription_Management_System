import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  subscriptionId: string;
  customer: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'past_due' | 'in_grace_period' | 'cancelled' | 'expired' | 'trialing';
  billingFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  currency: 'INR' | 'USD' | 'EUR';
  quantity: number;
  seatCount: number;
  unitPrice: number;
  taxRate: number; // e.g. 18 for 18% GST
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  renewalDate: Date;
  trialEndsAt?: Date;
  pausedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  gracePeriodEndsAt?: Date;
  autoRenew: boolean;
  teamMembers: Array<{
    name: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    addedAt: Date;
  }>;
  quotation?: mongoose.Types.ObjectId;
  prorationCreditBalance?: number;
  tenantId?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  activityTimeline?: Array<{
    event: string;
    description: string;
    timestamp: Date;
    actor?: string;
    metadata?: Record<string, any>;
  }>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionId: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'past_due', 'in_grace_period', 'cancelled', 'expired', 'trialing'],
      default: 'active',
      index: true,
    },
    billingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
      index: true,
    },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    quantity: { type: Number, default: 1, min: 1 },
    seatCount: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, default: Date.now },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    renewalDate: { type: Date, required: true, index: true },
    trialEndsAt: { type: Date },
    pausedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
    gracePeriodEndsAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
    teamMembers: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    quotation: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    prorationCreditBalance: { type: Number, default: 0 },
    tenantId: { type: String, default: 'subflow-primary', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    activityTimeline: [
      {
        event: { type: String, required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        actor: { type: String, default: 'System' },
        metadata: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
