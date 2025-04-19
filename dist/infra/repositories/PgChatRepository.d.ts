import { Chat } from '@/domain/entities/Chat';
import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { DatabaseService } from '@/infra/database/DatabaseService';
export declare class PgChatRepository implements ChatRepository {
    private db;
    constructor(db: DatabaseService);
    findById(id: string): Promise<Chat | null>;
    findByUserId(userId: string): Promise<Chat[]>;
    save(chat: Chat): Promise<Chat>;
    delete(id: string): Promise<void>;
    private mapToEntity;
}
