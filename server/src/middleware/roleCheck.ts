import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
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
