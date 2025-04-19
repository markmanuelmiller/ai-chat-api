import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { ChatService } from '@/application/services/ChatService';
import { logger } from '@/utils/logger';

export class CreateChatHandler implements WebSocketMessageHandler {
  constructor(private readonly chatService: ChatService) {}

  async handle(
    client: AuthenticatedClient,
    payload: { title: string },
    manager: WebSocketManager,
  ): Promise<void> {
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
    } catch (error) {
      logger.error('Error creating chat', error);
      client.send(JSON.stringify({
        type: 'error',
        error: 'Failed to create chat',
      }));
    }
  }
}
