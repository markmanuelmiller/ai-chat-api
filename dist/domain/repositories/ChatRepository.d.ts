import { Chat } from '@/domain/entities/Chat';
export interface ChatRepository {
    findById(id: string): Promise<Chat | null>;
    findByUserId(userId: string): Promise<Chat[]>;
    save(chat: Chat): Promise<Chat>;
    delete(id: string): Promise<void>;
}
