import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { AIService } from '@/application/services/AIService';
export declare class ChatMessageHandler implements WebSocketMessageHandler {
    private readonly aiService;
    constructor(aiService: AIService);
    handle(client: AuthenticatedClient, payload: {
        chatId: string;
        message: string;
        stream?: boolean;
    }, manager: WebSocketManager): Promise<void>;
}
