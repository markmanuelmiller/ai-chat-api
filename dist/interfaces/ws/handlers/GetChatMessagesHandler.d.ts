import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { ChatService } from '@/application/services/ChatService';
export declare class GetChatMessagesHandler implements WebSocketMessageHandler {
    private readonly chatService;
    constructor(chatService: ChatService);
    handle(client: AuthenticatedClient, payload: {
        chatId: string;
    }, manager: WebSocketManager): Promise<void>;
}
