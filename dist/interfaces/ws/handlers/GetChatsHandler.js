"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetChatsHandler = void 0;
const logger_1 = require("@/utils/logger");
class GetChatsHandler {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async handle(client, payload, manager) {
        try {
            const chats = await this.chatService.getChats(client.userId);
            client.send(JSON.stringify({
                type: 'chats_list',
                chats: chats.map(chat => ({
                    id: chat.id,
                    title: chat.title,
                    createdAt: chat.createdAt,
                })),
            }));
        }
        catch (error) {
            logger_1.logger.error('Error fetching chats', error);
            client.send(JSON.stringify({
                type: 'error',
                error: 'Failed to fetch chats',
            }));
        }
    }
}
exports.GetChatsHandler = GetChatsHandler;
//# sourceMappingURL=GetChatsHandler.js.map