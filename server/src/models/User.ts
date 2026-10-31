import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'staff' | 'customer';
  avatar?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  verificationOtp?: string;
  verificationOtpExpires?: Date;
  googleId?: string;
  twoFactorEnabled: boolean;
  status: 'active' | 'suspended' | 'inactive';
  lastLogin?: Date;
  loginIp?: string;
  loginCount: number;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'staff', 'customer'],
      default: 'customer',
      index: true,
    },
    avatar: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    verificationOtp: { type: String, select: false },
    verificationOtpExpires: { type: Date, select: false },
    googleId: { type: String, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
      index: true,
    },
    lastLogin: { type: Date },
    loginIp: { type: String, default: '' },
    loginCount: { type: Number, default: 0 },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
