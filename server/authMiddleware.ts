import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, storage, UserRecord } from './storage';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token required.' });
  }

  const token = authHeader.substring(7);
  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token.' });
  }

  const user = storage.getUserById(payload.id);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User account no longer exists.' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAuthToken(token);
    if (payload) {
      const user = storage.getUserById(payload.id);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}
