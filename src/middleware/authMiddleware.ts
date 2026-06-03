import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Authorization token missing.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Access forbidden. Invalid or expired token.' });
  }
};
