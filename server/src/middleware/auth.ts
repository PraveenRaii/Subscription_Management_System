import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
  customer?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_subflow_2026';
    const decoded: any = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('+password');
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
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};
