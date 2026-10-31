import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant extends Document {
  product: mongoose.Types.ObjectId;
  variantId: string;
  name: string;
  sku: string;
  attributes: Record<string, any>;
  basePrice: number;
  currency: 'INR' | 'USD' | 'EUR';
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  minQuantity: number;
  maxQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    attributes: { type: Schema.Types.Mixed, default: {} },
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    billingCycle: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    minQuantity: { type: Number, default: 1, min: 1 },
    maxQuantity: { type: Number, default: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ProductVariant = mongoose.model<IProductVariant>('ProductVariant', ProductVariantSchema);
