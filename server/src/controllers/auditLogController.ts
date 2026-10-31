import { Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, entity, severity, search, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (severity) filter.severity = severity;
    if (search) {
      filter.$or = [
        { action: { $regex: String(search), $options: 'i' } },
        { userName: { $regex: String(search), $options: 'i' } },
        { ipAddress: { $regex: String(search), $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
