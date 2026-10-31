import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscount extends Document {
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  appliesTo: 'all' | 'specific_plans' | 'specific_products';
  targetPlans: mongoose.Types.ObjectId[];
  targetProducts: mongoose.Types.ObjectId[];
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema = new Schema<IDiscount>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, required: true, min: 0 },
    appliesTo: {
      type: String,
      enum: ['all', 'specific_plans', 'specific_products'],
      default: 'all',
    },
    targetPlans: [{ type: Schema.Types.ObjectId, ref: 'Plan' }],
    targetProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Discount = mongoose.model<IDiscount>('Discount', DiscountSchema);
