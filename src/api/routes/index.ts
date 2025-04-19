import { Router } from 'express';
import { authRouter } from './authRoutes';
import { chatRouter } from './chatRoutes';
import { healthRouter } from './healthRoutes';
import { AuthController } from '@/api/controllers/AuthController';
import { ChatController } from '@/api/controllers/ChatController';
import { HealthController } from '@/api/controllers/HealthController';
import { AuthService } from '@/application/services/AuthService';

export const setupRoutes = (
  authController: AuthController,
  chatController: ChatController,
  healthController: HealthController,
  authService: AuthService,
) => {
  const router = Router();

  router.use('/auth', authRouter(authController));
  router.use('/chats', chatRouter(chatController, authService));
  router.use('/health', healthRouter(healthController));

  return router;
};
