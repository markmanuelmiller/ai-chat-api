import { AuthController } from '@/api/controllers/AuthController';
import { ChatController } from '@/api/controllers/ChatController';
import { HealthController } from '@/api/controllers/HealthController';
import { AuthService } from '@/application/services/AuthService';
export declare const setupRoutes: (authController: AuthController, chatController: ChatController, healthController: HealthController, authService: AuthService) => import("express-serve-static-core").Router;
