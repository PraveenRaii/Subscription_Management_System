import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  user: mongoose.Types.ObjectId;
  employeeId: string;
  department: 'Billing' | 'Support' | 'Sales' | 'Operations' | 'Admin';
  designation: string;
  permissions: string[];
  createdBy?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, index: true },
    department: {
      type: String,
      enum: ['Billing', 'Support', 'Sales', 'Operations', 'Admin'],
      default: 'Billing',
    },
    designation: { type: String, default: 'Billing Specialist' },
    permissions: {
      type: [String],
      default: [
        'read:customers',
        'read:subscriptions',
        'manage:invoices',
        'read:payments',
        'support:tickets',
      ],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);
