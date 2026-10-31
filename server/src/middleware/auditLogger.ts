import { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';

interface LogOptions {
  user?: any;
  action: string;
  entity: 'User' | 'Subscription' | 'Invoice' | 'Payment' | 'Plan' | 'Product' | 'Coupon' | 'Setting' | 'Security';
  entityId?: string;
  details?: Record<string, any>;
  severity?: 'info' | 'warning' | 'critical';
  req?: Request;
}

export const logAudit = async (options: LogOptions): Promise<void> => {
  try {
    const ipAddress =
      (options.req?.headers['x-forwarded-for'] as string) ||
      options.req?.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = (options.req?.headers['user-agent'] as string) || 'Server';

    await AuditLog.create({
      user: options.user?._id || options.user?.id,
      userName: options.user?.name || 'System / Automated',
      userRole: options.user?.role || 'system',
      action: options.action,
      entity: options.entity,
      entityId: options.entityId || '',
      ipAddress,
      userAgent,
      details: options.details || {},
      severity: options.severity || 'info',
    });
  } catch (err: any) {
    console.error('Failed to write audit log:', err.message);
  }
};
