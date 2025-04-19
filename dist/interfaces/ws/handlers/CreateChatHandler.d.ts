import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { ChatService } from '@/application/services/ChatService';
export declare class CreateChatHandler implements WebSocketMessageHandler {
    private readonly chatService;
    constructor(chatService: ChatService);
    handle(client: AuthenticatedClient, payload: {
        title: string;
    }, manager: WebSocketManager): Promise<void>;
}
