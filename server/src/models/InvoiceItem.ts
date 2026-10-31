import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem extends Document {
  invoice: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  type: 'subscription' | 'addon' | 'overage' | 'onetime';
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    description: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ['subscription', 'addon', 'overage', 'onetime'],
      default: 'subscription',
    },
  },
  { timestamps: true }
);

export const InvoiceItem = mongoose.model<IInvoiceItem>('InvoiceItem', InvoiceItemSchema);
