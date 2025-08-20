import { Chat } from '@/domain/entities/Chat';
import { ChatRepository } from '@/domain/repositories/ChatRepository';
export declare class InMemoryChatRepository implements ChatRepository {
    private chats;
    findById(id: string): Promise<Chat | null>;
    findByUserId(userId: string): Promise<Chat[]>;
    save(chat: Chat): Promise<Chat>;
    delete(id: string): Promise<void>;
}
