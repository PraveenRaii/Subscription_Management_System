import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  type: 'credit' | 'debit' | 'refund' | 'adjustment';
  amount: number;
  currency: 'INR' | 'USD' | 'EUR';
  customer: mongoose.Types.ObjectId;
  payment?: mongoose.Types.ObjectId;
  invoice?: mongoose.Types.ObjectId;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  balanceAfter?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['credit', 'debit', 'refund', 'adjustment'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed',
      index: true,
    },
    description: { type: String, default: '' },
    balanceAfter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
