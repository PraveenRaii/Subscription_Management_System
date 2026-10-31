import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  planId: string;
  name: string;
  product?: mongoose.Types.ObjectId;
  variant?: mongoose.Types.ObjectId;
  description: string;
  category: 'Starter' | 'Professional' | 'Enterprise' | 'Addon' | 'Custom';
  billingFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priceINR: number;
  priceUSD: number;
  priceEUR: number;
  currency: string;
  trialDays: number;
  features: string[];
  limits: {
    users: number;
    apiCalls: number;
    storageGB: number;
    projects: number;
  };
  isActive: boolean;
  isPopular: boolean;
  activationDate?: Date;
  expirationDate?: Date;
  gracePeriodDays: number;
  allowedUpgrades: mongoose.Types.ObjectId[];
  allowedDowngrades: mongoose.Types.ObjectId[];
  isTeamPlan: boolean;
  seatPrice: number;
  minSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    planId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise', 'Addon', 'Custom'],
      default: 'Starter',
      index: true,
    },
    billingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
      index: true,
    },
    priceINR: { type: Number, required: true, default: 0 },
    priceUSD: { type: Number, required: true, default: 0 },
    priceEUR: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },
    trialDays: { type: Number, default: 14 },
    features: { type: [String], default: [] },
    limits: {
      users: { type: Number, default: 1 },
      apiCalls: { type: Number, default: 10000 },
      storageGB: { type: Number, default: 10 },
      projects: { type: Number, default: 5 },
    },
    isActive: { type: Boolean, default: true, index: true },
    isPopular: { type: Boolean, default: false },
    activationDate: { type: Date, default: Date.now },
    expirationDate: { type: Date },
    gracePeriodDays: { type: Number, default: 7 },
    allowedUpgrades: [{ type: Schema.Types.ObjectId, ref: 'Plan' }],
    allowedDowngrades: [{ type: Schema.Types.ObjectId, ref: 'Plan' }],
    isTeamPlan: { type: Boolean, default: false },
    seatPrice: { type: Number, default: 0 },
    minSeats: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
