import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditNote extends Document {
  creditNoteNumber: string;
  invoice: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  amount: number;
  currency: 'INR' | 'USD' | 'EUR';
  reason: 'refund' | 'plan_downgrade_proration' | 'billing_error' | 'customer_retention' | 'service_outage';
  description: string;
  status: 'issued' | 'applied' | 'refunded';
  refundTransactionId?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreditNoteSchema = new Schema<ICreditNote>(
  {
    creditNoteNumber: { type: String, required: true, unique: true, index: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    reason: {
      type: String,
      enum: ['refund', 'plan_downgrade_proration', 'billing_error', 'customer_retention', 'service_outage'],
      default: 'refund',
    },
    description: { type: String, default: 'Credit note adjustment' },
    status: {
      type: String,
      enum: ['issued', 'applied', 'refunded'],
      default: 'issued',
      index: true,
    },
    refundTransactionId: { type: String, default: '' },
    tenantId: { type: String, default: 'subflow-primary', index: true },
  },
  { timestamps: true }
);

export const CreditNote = mongoose.model<ICreditNote>('CreditNote', CreditNoteSchema);
