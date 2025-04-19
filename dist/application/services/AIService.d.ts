import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { Message } from '@/domain/entities/Message';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';
export declare class AIService {
    private readonly chatRepository;
    private readonly messageRepository;
    private readonly eventEmitter;
    constructor(chatRepository: ChatRepository, messageRepository: MessageRepository, eventEmitter: DomainEventEmitter);
    generateResponse(chatId: string, userMessage: string): Promise<Message>;
    streamResponse(chatId: string, userMessage: string): Promise<AsyncGenerator<string, void, unknown>>;
}
