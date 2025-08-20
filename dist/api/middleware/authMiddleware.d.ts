import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/application/services/AuthService';
export interface AuthenticatedRequest extends Request {
    userId?: string;
}
export declare const authMiddleware: (authService: AuthService) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
