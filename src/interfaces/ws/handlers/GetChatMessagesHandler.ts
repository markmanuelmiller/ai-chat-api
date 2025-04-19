import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { ChatService } from '@/application/services/ChatService';
import { logger } from '@/utils/logger';

export class GetChatMessagesHandler implements WebSocketMessageHandler {
  constructor(private readonly chatService: ChatService) {}

  async handle(
    client: AuthenticatedClient,
    payload: { chatId: string },
    manager: WebSocketManager,
  ): Promise<void> {
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
    } catch (error) {
      logger.error('Error fetching chat messages', error);
      client.send(JSON.stringify({
        type: 'error',
        error: 'Failed to fetch chat messages',
      }));
    }
  }
}
