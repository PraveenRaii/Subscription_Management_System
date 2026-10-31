"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: Access requires one of [${roles.join(', ')}] permissions. Current role: ${req.user.role}`,
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
