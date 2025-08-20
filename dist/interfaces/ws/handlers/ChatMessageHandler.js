"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageHandler = void 0;
const logger_1 = require("@/utils/logger");
class ChatMessageHandler {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async handle(client, payload, manager) {
        const { chatId, message, stream = true } = payload;
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
            // @todo: remove this line
            // const stream = false;
            if (stream) {
                // Call AIService.streamResponse to kick off the streaming. 
                // AIService will use the WebSocketManager to push messages to a queue,
                // and WebSocketManager will send those messages to the client.
                // The client.userId is needed by AIService.
                await this.aiService.streamResponse(chatId, client.userId, message);
                // No need to loop here anymore, as WebSocketManager handles sending queued messages.
                // The client will receive STREAM_START, CHUNK, STREAM_END, etc., from the queue.
                // We can consider if an additional ack like 'STREAM_INITIATED' is useful here,
                // but 'message_received' already serves as an initial ack.
                // The old 'chat_response_chunk' and 'chat_response_complete' from this handler are now obsolete.
            }
            else {
                // Generate the full response without streaming
                const fullResponse = await this.aiService.generateResponse(chatId, message);
                // Send the complete response
                client.send(JSON.stringify({
                    type: 'chat_response_full',
                    chatId,
                    content: fullResponse,
                }));
            }
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