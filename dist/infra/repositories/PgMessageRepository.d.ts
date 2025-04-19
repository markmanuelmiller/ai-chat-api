import { Message } from '@/domain/entities/Message';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { DatabaseService } from '@/infra/database/DatabaseService';
export declare class PgMessageRepository implements MessageRepository {
    private db;
    constructor(db: DatabaseService);
    findById(id: string): Promise<Message | null>;
    findByChatId(chatId: string): Promise<Message[]>;
    save(message: Message): Promise<Message>;
    delete(id: string): Promise<void>;
    private mapToEntity;
}
