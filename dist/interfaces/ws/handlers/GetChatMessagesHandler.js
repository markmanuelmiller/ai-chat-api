"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetChatMessagesHandler = void 0;
const logger_1 = require("@/utils/logger");
class GetChatMessagesHandler {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async handle(client, payload, manager) {
        const { chatId } = payload;
        if (!chatId) {
            client.send(JSON.stringify({
                type: 'error',
                error: 'chatId is required',
            }));
            return;
        }
        try {
            const chat = await this.chatService.getChatById(chatId);
            if (!chat || chat.userId !== client.userId) {
                client.send(JSON.stringify({
                    type: 'error',
                    error: 'Chat not found or access denied',
                }));
                return;
            }
            const messages = await this.chatService.getMessages(chatId);
            client.send(JSON.stringify({
                type: 'chat_messages',
                chatId,
                messages: messages.map(message => ({
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    createdAt: message.createdAt,
                })),
            }));
        }
        catch (error) {
            logger_1.logger.error('Error fetching chat messages', error);
            client.send(JSON.stringify({
                type: 'error',
                error: 'Failed to fetch chat messages',
            }));
        }
    }
}
exports.GetChatMessagesHandler = GetChatMessagesHandler;
//# sourceMappingURL=GetChatMessagesHandler.js.map