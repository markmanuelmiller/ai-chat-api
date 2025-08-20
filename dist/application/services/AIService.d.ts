import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { Message } from '@/domain/entities/Message';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';
import { WebSocketManager } from '@/interfaces/ws/WebSocketManager';
export declare class AIService {
    private readonly chatRepository;
    private readonly messageRepository;
    private readonly eventEmitter;
    private readonly config;
    private readonly webSocketManager;
    private llm;
    private debugStreamService;
    constructor(chatRepository: ChatRepository, messageRepository: MessageRepository, eventEmitter: DomainEventEmitter, config: any, webSocketManager: WebSocketManager);
    generateResponse(chatId: string, userMessage: string): Promise<Message>;
    streamResponse(chatId: string, userId: string, userMessage: string): Promise<void>;
    /**
     * This method provides a simpler fallback implementation using just LangChain without the graph
     * It's useful in case the graph implementation has issues
     */
    simpleLangchainResponse(chatId: string, userMessage: string): Promise<string>;
}
