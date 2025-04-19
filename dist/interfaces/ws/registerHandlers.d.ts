import { WebSocketManager } from './WebSocketManager';
import { ChatService } from '@/application/services/ChatService';
import { AIService } from '@/application/services/AIService';
export declare const registerWebSocketHandlers: (wsManager: WebSocketManager, chatService: ChatService, aiService: AIService) => void;
