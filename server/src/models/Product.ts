import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  productId: string;
  name: string;
  slug: string;
  description: string;
  category: 'SaaS' | 'API' | 'Analytics' | 'Addon' | 'Support' | 'Custom';
  images: string[];
  isActive: boolean;
  hasVariants: boolean;
  metadata: Record<string, any>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['SaaS', 'API', 'Analytics', 'Addon', 'Support', 'Custom'],
      default: 'SaaS',
      index: true,
    },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    hasVariants: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
