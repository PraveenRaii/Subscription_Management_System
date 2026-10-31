"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = require("../models/User.js");
const authenticate = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
            return;
        }
        const secret = process.env.JWT_SECRET || 'super_secret_jwt_subflow_2026';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await User_js_1.User.findById(decoded.id).select('+password');
        if (!user) {
            res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
            return;
        }
        if (user.status !== 'active') {
            res.status(403).json({ success: false, message: `Account is ${user.status}. Please contact support.` });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
    }
};
exports.authenticate = authenticate;
