import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  subscription?: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  status: 'paid' | 'unpaid' | 'overdue' | 'partially_paid' | 'cancelled';
  currency: 'INR' | 'USD' | 'EUR';
  subtotal: number;
  taxRate: number; // e.g. 18 for GST
  taxAmount: number;
  isInterstate?: boolean;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  sacCode?: string;
  customerGstin?: string;
  companyGstin?: string;
  tenantId?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  pdfUrl?: string;
  notes: string;
  paymentMethod?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    billingPeriodStart: { type: Date, required: true },
    billingPeriodEnd: { type: Date, required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'overdue', 'partially_paid', 'cancelled'],
      default: 'unpaid',
      index: true,
    },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    subtotal: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    isInterstate: { type: Boolean, default: false },
    cgstRate: { type: Number, default: 9 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 9 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    sacCode: { type: String, default: '997331' },
    customerGstin: { type: String, default: '' },
    companyGstin: { type: String, default: '29AABCS1429B1Z8' },
    tenantId: { type: String, default: 'subflow-primary', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    discountAmount: { type: Number, default: 0 },
    discountCode: { type: String, default: '' },
    totalAmount: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountRemaining: { type: Number, default: 0 },
    pdfUrl: { type: String, default: '' },
    notes: { type: String, default: 'Thank you for your business. Please remit payment on or before the due date.' },
    paymentMethod: { type: String, default: '' },
    idempotencyKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
