import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { AIService } from '@/application/services/AIService';
import { logger } from '@/utils/logger';

export class ChatMessageHandler implements WebSocketMessageHandler {
  constructor(private readonly aiService: AIService) {}

  async handle(
    client: AuthenticatedClient,
    payload: { chatId: string; message: string; stream?: boolean },
    manager: WebSocketManager,
  ): Promise<void> {
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
        // Start streaming the response
        const responseStream = await this.aiService.streamResponse(chatId, message);

        // Send each chunk as it comes in
        for await (const chunk of responseStream) {
          client.send(JSON.stringify({
            type: 'chat_response_chunk',
            chatId,
            chunk,
          }));
        }

        // Signal completion of the response stream
        client.send(JSON.stringify({
          type: 'chat_response_complete',
          chatId,
        }));
      } else {
        // Generate the full response without streaming
        const fullResponse = await this.aiService.generateResponse(chatId, message);
        
        // Send the complete response
        client.send(JSON.stringify({
          type: 'chat_response_full',
          chatId,
          content: fullResponse.content,
        }));
      }
    } catch (error) {
      logger.error('Error processing chat message', error);
      client.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process chat message',
      }));
    }
  }
}
