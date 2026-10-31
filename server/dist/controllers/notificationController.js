"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const Notification_js_1 = require("../models/Notification.js");
const getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated.' });
            return;
        }
        const notifications = await Notification_js_1.Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(30);
        const unreadCount = await Notification_js_1.Notification.countDocuments({
            recipient: req.user._id,
            isRead: false,
        });
        res.json({
            success: true,
            notifications,
            unreadCount,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification_js_1.Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() });
        res.json({ success: true, message: 'Notification marked as read.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await Notification_js_1.Notification.updateMany({ recipient: req.user?._id, isRead: false }, { isRead: true, readAt: new Date() });
        res.json({ success: true, message: 'All notifications marked as read.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.markAllAsRead = markAllAsRead;
