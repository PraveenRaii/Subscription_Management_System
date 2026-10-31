import mongoose, { Schema, Document } from 'mongoose';

export interface IQuotationItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface IQuotation extends Document {
  quotationNumber: string;
  customer?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  companyName: string;
  items: IQuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  currency: 'INR' | 'USD' | 'EUR';
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  templateName: string;
  termsAndConditions: string;
  notes: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuotationSchema = new Schema<IQuotation>(
  {
    quotationNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    companyName: { type: String, default: '' },
    items: { type: [QuotationItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'converted'],
      default: 'draft',
      index: true,
    },
    templateName: { type: String, default: 'Standard SaaS Enterprise Quotation' },
    termsAndConditions: {
      type: String,
      default:
        '1. Quotation valid for 30 days.\n2. Invoicing begins upon customer onboarding.\n3. Net-15 payment terms apply.\n4. Standard 99.9% uptime SLA included.',
    },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Quotation = mongoose.model<IQuotation>('Quotation', QuotationSchema);
