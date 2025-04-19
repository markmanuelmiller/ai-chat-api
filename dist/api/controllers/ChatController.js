"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const errorMiddleware_1 = require("@/api/middleware/errorMiddleware");
const logger_1 = require("@/utils/logger");
class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
        this.createChat = async (req, res) => {
            try {
                const { title } = req.body;
                const userId = req.userId;
                if (!title) {
                    throw new errorMiddleware_1.AppError(400, 'Title is required');
                }
                const chat = await this.chatService.createChat(userId, title);
                res.status(201).json({
                    id: chat.id,
                    title: chat.title,
                    createdAt: chat.createdAt,
                });
            }
            catch (error) {
                logger_1.logger.error('Error creating chat', error);
                throw error;
            }
        };
        this.getChats = async (req, res) => {
            try {
                const userId = req.userId;
                const chats = await this.chatService.getChats(userId);
                res.status(200).json({
                    chats: chats.map(chat => ({
                        id: chat.id,
                        title: chat.title,
                        createdAt: chat.createdAt,
                    })),
                });
            }
            catch (error) {
                logger_1.logger.error('Error fetching chats', error);
                throw error;
            }
        };
        this.getChatById = async (req, res) => {
            try {
                const { chatId } = req.params;
                const userId = req.userId;
                const chat = await this.chatService.getChatById(chatId);
                if (!chat) {
                    throw new errorMiddleware_1.AppError(404, 'Chat not found');
                }
                if (chat.userId !== userId) {
                    throw new errorMiddleware_1.AppError(403, 'Access denied');
                }
                res.status(200).json({
                    id: chat.id,
                    title: chat.title,
                    createdAt: chat.createdAt,
                });
            }
            catch (error) {
                logger_1.logger.error('Error fetching chat', error);
                throw error;
            }
        };
        this.updateChatTitle = async (req, res) => {
            try {
                const { chatId } = req.params;
                const { title } = req.body;
                const userId = req.userId;
                if (!title) {
                    throw new errorMiddleware_1.AppError(400, 'Title is required');
                }
                const chat = await this.chatService.getChatById(chatId);
                if (!chat) {
                    throw new errorMiddleware_1.AppError(404, 'Chat not found');
                }
                if (chat.userId !== userId) {
                    throw new errorMiddleware_1.AppError(403, 'Access denied');
                }
                const updatedChat = await this.chatService.updateChatTitle(chatId, title);
                res.status(200).json({
                    id: updatedChat.id,
                    title: updatedChat.title,
                    createdAt: updatedChat.createdAt,
                    updatedAt: updatedChat.updatedAt,
                });
            }
            catch (error) {
                logger_1.logger.error('Error updating chat title', error);
                throw error;
            }
        };
        this.deleteChat = async (req, res) => {
            try {
                const { chatId } = req.params;
                const userId = req.userId;
                const chat = await this.chatService.getChatById(chatId);
                if (!chat) {
                    throw new errorMiddleware_1.AppError(404, 'Chat not found');
                }
                if (chat.userId !== userId) {
                    throw new errorMiddleware_1.AppError(403, 'Access denied');
                }
                await this.chatService.deleteChat(chatId);
                res.status(204).send();
            }
            catch (error) {
                logger_1.logger.error('Error deleting chat', error);
                throw error;
            }
        };
        this.getChatMessages = async (req, res) => {
            try {
                const { chatId } = req.params;
                const userId = req.userId;
                const chat = await this.chatService.getChatById(chatId);
                if (!chat) {
                    throw new errorMiddleware_1.AppError(404, 'Chat not found');
                }
                if (chat.userId !== userId) {
                    throw new errorMiddleware_1.AppError(403, 'Access denied');
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
            }
            catch (error) {
                logger_1.logger.error('Error fetching chat messages', error);
                throw error;
            }
        };
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=ChatController.js.map