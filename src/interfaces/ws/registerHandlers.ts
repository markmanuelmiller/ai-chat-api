import { WebSocketManager } from './WebSocketManager';
import { ChatMessageHandler } from './handlers/ChatMessageHandler';
import { CreateChatHandler } from './handlers/CreateChatHandler';
import { GetChatsHandler } from './handlers/GetChatsHandler';
import { GetChatMessagesHandler } from './handlers/GetChatMessagesHandler';
import { ChatService } from '@/application/services/ChatService';
import { AIService } from '@/application/services/AIService';

export const registerWebSocketHandlers = (
  wsManager: WebSocketManager,
  chatService: ChatService,
  aiService: AIService,
) => {
  const registry = wsManager.getHandlerRegistry();

  // Register message handlers
  registry.registerHandler('chat_message', new ChatMessageHandler(aiService));
  registry.registerHandler('create_chat', new CreateChatHandler(chatService));
  registry.registerHandler('get_chats', new GetChatsHandler(chatService));
  registry.registerHandler('get_chat_messages', new GetChatMessagesHandler(chatService));
};
