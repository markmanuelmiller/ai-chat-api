import { Request, Response } from 'express';
import { AuthService } from '@/application/services/AuthService';
import { logger } from '@/utils/logger';
import { AppError } from '@/api/middleware/errorMiddleware';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        throw new AppError(400, 'Email, password and name are required');
      }

      const result = await this.authService.register(email, password, name);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new AppError(409, error.message);
      }
      throw error;
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(400, 'Email and password are required');
      }

      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid email or password')) {
        throw new AppError(401, 'Invalid email or password');
      }
      throw error;
    }
  };
}
