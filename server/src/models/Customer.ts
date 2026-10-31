import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  user: mongoose.Types.ObjectId;
  customerId: string;
  companyName: string;
  taxId: string; // GSTIN or Tax identifier
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: 'INR' | 'USD' | 'EUR';
  totalSpent: number;
  lifetimeValue: number;
  churnRiskScore: number; // 0 - 100
  churnRiskLevel: 'Low' | 'Medium' | 'High';
  churnFactors: string[];
  referralCode: string;
  referredBy?: string;
  rewardPoints: number;
  notes?: string;
  status: 'active' | 'churned' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    customerId: { type: String, required: true, unique: true, index: true },
    companyName: { type: String, default: '' },
    taxId: { type: String, default: '' },
    billingAddress: {
      street: { type: String, default: '100 Innovation Blvd' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      postalCode: { type: String, default: '560001' },
      country: { type: String, default: 'India' },
    },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    totalSpent: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    churnRiskScore: { type: Number, default: 15 },
    churnRiskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    churnFactors: { type: [String], default: [] },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    rewardPoints: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'churned', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
