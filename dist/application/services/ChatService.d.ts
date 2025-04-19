import { Chat } from '@/domain/entities/Chat';
import { Message, MessageRole } from '@/domain/entities/Message';
import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';
export declare class ChatService {
    private readonly chatRepository;
    private readonly messageRepository;
    private readonly eventEmitter;
    constructor(chatRepository: ChatRepository, messageRepository: MessageRepository, eventEmitter: DomainEventEmitter);
    createChat(userId: string, title: string): Promise<Chat>;
    getChats(userId: string): Promise<Chat[]>;
    getChatById(chatId: string): Promise<Chat | null>;
    updateChatTitle(chatId: string, title: string): Promise<Chat>;
    deleteChat(chatId: string): Promise<void>;
    getMessages(chatId: string): Promise<Message[]>;
    addMessage(chatId: string, role: MessageRole, content: string): Promise<Message>;
}
