import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, TokenPayload } from '../utils/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('❌ Authorization failed: No user in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log(`🔒 Checking authorization: User role="${req.user.role}" vs Allowed roles=[${allowedRoles.join(', ')}]`);
    
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Authorization failed: Role "${req.user.role}" not in allowed roles [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ 
        message: 'Access forbidden - Insufficient permissions',
        details: `Your role: ${req.user.role}, Required role(s): ${allowedRoles.join(' or ')}`
      });
    }

    console.log(`✅ Authorization successful for role: ${req.user.role}`);
    next();
  };
};