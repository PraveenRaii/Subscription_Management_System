import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  action: string;
  entity: 'User' | 'Subscription' | 'Invoice' | 'Payment' | 'Plan' | 'Product' | 'Coupon' | 'Setting' | 'Security';
  entityId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'System' },
    userRole: { type: String, default: 'system' },
    action: { type: String, required: true, index: true },
    entity: {
      type: String,
      enum: ['User', 'Subscription', 'Invoice', 'Payment', 'Plan', 'Product', 'Coupon', 'Setting', 'Security'],
      required: true,
      index: true,
    },
    entityId: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
    details: { type: Schema.Types.Mixed, default: {} },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
