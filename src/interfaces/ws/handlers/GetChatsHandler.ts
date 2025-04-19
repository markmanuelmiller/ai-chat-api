import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { ChatService } from '@/application/services/ChatService';
import { logger } from '@/utils/logger';

export class GetChatsHandler implements WebSocketMessageHandler {
  constructor(private readonly chatService: ChatService) {}

  async handle(
    client: AuthenticatedClient,
    payload: any,
    manager: WebSocketManager,
  ): Promise<void> {
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
    } catch (error) {
      logger.error('Error fetching chats', error);
      client.send(JSON.stringify({
        type: 'error',
        error: 'Failed to fetch chats',
      }));
    }
  }
}
