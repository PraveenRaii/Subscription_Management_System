import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  currency: 'INR' | 'USD' | 'EUR';
  minPurchaseAmount: number;
  maxDiscountAmount: number;
  startDate: Date;
  endDate: Date;
  maxRedemptions: number;
  redemptionCount: number;
  isActive: boolean;
  allowedCustomers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    minPurchaseAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 }, // 0 means no cap
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    maxRedemptions: { type: Number, default: 100 },
    redemptionCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    allowedCustomers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
