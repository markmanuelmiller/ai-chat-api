import { ChatController } from '@/api/controllers/ChatController';
import { AuthService } from '@/application/services/AuthService';
export declare const chatRouter: (chatController: ChatController, authService: AuthService) => import("express-serve-static-core").Router;
