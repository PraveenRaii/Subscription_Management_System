"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStaffPermissions = exports.getStaffMembers = void 0;
const Staff_js_1 = require("../models/Staff.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const getStaffMembers = async (req, res) => {
    try {
        const staff = await Staff_js_1.Staff.find()
            .populate('user', 'name email avatar status lastLogin')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            staff,
            count: staff.length,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getStaffMembers = getStaffMembers;
const updateStaffPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { department, designation, permissions, status } = req.body;
        const staff = await Staff_js_1.Staff.findById(id).populate('user');
        if (!staff) {
            res.status(404).json({ success: false, message: 'Staff record not found.' });
            return;
        }
        if (department)
            staff.department = department;
        if (designation)
            staff.designation = designation;
        if (permissions)
            staff.permissions = permissions;
        if (status)
            staff.status = status;
        await staff.save();
        await (0, auditLogger_js_1.logAudit)({
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateStaffPermissions = updateStaffPermissions;
