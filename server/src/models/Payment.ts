import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  invoice: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  amount: number;
  currency: 'INR' | 'USD' | 'EUR';
  paymentMethod: 'razorpay' | 'card' | 'upi' | 'netbanking' | 'bank_transfer' | 'wallet';
  status: 'success' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  gatewayTransactionId?: string;
  gatewayOrderId?: string;
  gatewaySignature?: string;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: Date;
  refundedAmount: number;
  refundReason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'card', 'upi', 'netbanking', 'bank_transfer', 'wallet'],
      default: 'razorpay',
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },
    gatewayTransactionId: { type: String, default: '' },
    gatewayOrderId: { type: String, default: '' },
    gatewaySignature: { type: String, default: '' },
    failureReason: { type: String, default: '' },
    retryCount: { type: Number, default: 0 },
    nextRetryAt: { type: Date },
    refundedAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
