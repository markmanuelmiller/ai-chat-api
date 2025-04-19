import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { AIService } from '@/application/services/AIService';
import { logger } from '@/utils/logger';

export class ChatMessageHandler implements WebSocketMessageHandler {
  constructor(private readonly aiService: AIService) {}

  async handle(
    client: AuthenticatedClient,
    payload: { chatId: string; message: string },
    manager: WebSocketManager,
  ): Promise<void> {
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
    } catch (error) {
      logger.error('Error processing chat message', error);
      client.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process chat message',
      }));
    }
  }
}
