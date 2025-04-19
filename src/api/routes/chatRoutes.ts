import { Router } from 'express';
import { ChatController } from '@/api/controllers/ChatController';
import { authMiddleware } from '@/api/middleware/authMiddleware';
import { AuthService } from '@/application/services/AuthService';

export const chatRouter = (chatController: ChatController, authService: AuthService) => {
  const router = Router();
  const auth = authMiddleware(authService);

  router.use(auth);

  router.post('/', chatController.createChat);
  router.get('/', chatController.getChats);
  router.get('/:chatId', chatController.getChatById);
  router.put('/:chatId/title', chatController.updateChatTitle);
  router.delete('/:chatId', chatController.deleteChat);
  router.get('/:chatId/messages', chatController.getChatMessages);

  return router;
};
