import { Request, Response } from 'express';
import { ChatService } from '@/application/services/ChatService';
import { AuthenticatedRequest } from '@/api/middleware/authMiddleware';
import { AppError } from '@/api/middleware/errorMiddleware';
import { logger } from '@/utils/logger';

export class ChatController {
  constructor(private chatService: ChatService) {}

  createChat = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title } = req.body;
      const userId = req.userId!;

      if (!title) {
        throw new AppError(400, 'Title is required');
      }

      const chat = await this.chatService.createChat(userId, title);
      res.status(201).json({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
      });
    } catch (error) {
      logger.error('Error creating chat', error);
      throw error;
    }
  };

  getChats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const chats = await this.chatService.getChats(userId);

      res.status(200).json({
        chats: chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
        })),
      });
    } catch (error) {
      logger.error('Error fetching chats', error);
      throw error;
    }
  };

  getChatById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = req.userId!;

      const chat = await this.chatService.getChatById(chatId);

      if (!chat) {
        throw new AppError(404, 'Chat not found');
      }

      if (chat.userId !== userId) {
        throw new AppError(403, 'Access denied');
      }

      res.status(200).json({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
      });
    } catch (error) {
      logger.error('Error fetching chat', error);
      throw error;
    }
  };

  updateChatTitle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const { title } = req.body;
      const userId = req.userId!;

      if (!title) {
        throw new AppError(400, 'Title is required');
      }

      const chat = await this.chatService.getChatById(chatId);

      if (!chat) {
        throw new AppError(404, 'Chat not found');
      }

      if (chat.userId !== userId) {
        throw new AppError(403, 'Access denied');
      }

      const updatedChat = await this.chatService.updateChatTitle(chatId, title);

      res.status(200).json({
        id: updatedChat.id,
        title: updatedChat.title,
        createdAt: updatedChat.createdAt,
        updatedAt: updatedChat.updatedAt,
      });
    } catch (error) {
      logger.error('Error updating chat title', error);
      throw error;
    }
  };

  deleteChat = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = req.userId!;

      const chat = await this.chatService.getChatById(chatId);

      if (!chat) {
        throw new AppError(404, 'Chat not found');
      }

      if (chat.userId !== userId) {
        throw new AppError(403, 'Access denied');
      }

      await this.chatService.deleteChat(chatId);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting chat', error);
      throw error;
    }
  };

  getChatMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = req.userId!;

      const chat = await this.chatService.getChatById(chatId);

      if (!chat) {
        throw new AppError(404, 'Chat not found');
      }

      if (chat.userId !== userId) {
        throw new AppError(403, 'Access denied');
      }

      const messages = await this.chatService.getMessages(chatId);

      res.status(200).json({
        messages: messages.map(message => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        })),
      });
    } catch (error) {
      logger.error('Error fetching chat messages', error);
      throw error;
    }
  };
}
