"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const AuditLog_js_1 = require("../models/AuditLog.js");
const getAuditLogs = async (req, res) => {
    try {
        const { action, entity, severity, search, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (action)
            filter.action = action;
        if (entity)
            filter.entity = entity;
        if (severity)
            filter.severity = severity;
        if (search) {
            filter.$or = [
                { action: { $regex: String(search), $options: 'i' } },
                { userName: { $regex: String(search), $options: 'i' } },
                { ipAddress: { $regex: String(search), $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const logs = await AuditLog_js_1.AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await AuditLog_js_1.AuditLog.countDocuments(filter);
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getAuditLogs = getAuditLogs;
