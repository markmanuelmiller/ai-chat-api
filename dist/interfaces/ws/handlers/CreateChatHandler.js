"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChatHandler = void 0;
const logger_1 = require("@/utils/logger");
class CreateChatHandler {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async handle(client, payload, manager) {
        const { title } = payload;
        if (!title) {
            client.send(JSON.stringify({
                type: 'error',
                error: 'title is required',
            }));
            return;
        }
        try {
            const chat = await this.chatService.createChat(client.userId, title);
            client.send(JSON.stringify({
                type: 'chat_created',
                chat: {
                    id: chat.id,
                    title: chat.title,
                    createdAt: chat.createdAt,
                },
            }));
        }
        catch (error) {
            logger_1.logger.error('Error creating chat', error);
            client.send(JSON.stringify({
                type: 'error',
                error: 'Failed to create chat',
            }));
        }
    }
}
exports.CreateChatHandler = CreateChatHandler;
//# sourceMappingURL=CreateChatHandler.js.map