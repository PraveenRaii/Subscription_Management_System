"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const AuditLog_js_1 = require("../models/AuditLog.js");
const logAudit = async (options) => {
    try {
        const ipAddress = options.req?.headers['x-forwarded-for'] ||
            options.req?.socket?.remoteAddress ||
            '127.0.0.1';
        const userAgent = options.req?.headers['user-agent'] || 'Server';
        await AuditLog_js_1.AuditLog.create({
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
    }
    catch (err) {
        console.error('Failed to write audit log:', err.message);
    }
};
exports.logAudit = logAudit;
