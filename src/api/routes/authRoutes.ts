import { Router } from 'express';
import { AuthController } from '@/api/controllers/AuthController';

export const authRouter = (authController: AuthController) => {
  const router = Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);

  return router;
};
