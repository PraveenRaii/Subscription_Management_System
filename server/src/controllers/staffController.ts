import { Response } from 'express';
import { Staff } from '../models/Staff.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

export const getStaffMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await Staff.find()
      .populate('user', 'name email avatar status lastLogin')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      staff,
      count: staff.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStaffPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { department, designation, permissions, status } = req.body;

    const staff = await Staff.findById(id).populate('user');
    if (!staff) {
      res.status(404).json({ success: false, message: 'Staff record not found.' });
      return;
    }

    if (department) staff.department = department;
    if (designation) staff.designation = designation;
    if (permissions) staff.permissions = permissions;
    if (status) staff.status = status;

    await staff.save();

    await logAudit({
      user: req.user,
      action: 'STAFF_PERMISSIONS_UPDATED',
      entity: 'User',
      entityId: staff._id.toString(),
      details: { employeeId: staff.employeeId, permissions },
      req,
    });

    res.json({
      success: true,
      message: 'Staff permissions updated successfully.',
      staff,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
