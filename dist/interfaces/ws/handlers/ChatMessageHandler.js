"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageHandler = void 0;
const logger_1 = require("@/utils/logger");
class ChatMessageHandler {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async handle(client, payload, manager) {
        const { chatId, message } = payload;
        if (!chatId || !message) {
            client.send(JSON.stringify({
                type: 'error',
                error: 'chatId and message are required',
            }));
            return;
        }
        try {
            // Acknowledge receipt of the message
            client.send(JSON.stringify({
                type: 'message_received',
                chatId,
            }));
            // Start streaming the response
            const stream = await this.aiService.streamResponse(chatId, message);
            // Send each chunk as it comes in
            for await (const chunk of stream) {
                client.send(JSON.stringify({
                    type: 'chat_response_chunk',
                    chatId,
                    chunk,
                }));
            }
            // Signal completion of the response
            client.send(JSON.stringify({
                type: 'chat_response_complete',
                chatId,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error processing chat message', error);
            client.send(JSON.stringify({
                type: 'error',
                error: 'Failed to process chat message',
            }));
        }
    }
}
exports.ChatMessageHandler = ChatMessageHandler;
//# sourceMappingURL=ChatMessageHandler.js.map