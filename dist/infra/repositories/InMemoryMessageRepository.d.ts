import { Message } from '@/domain/entities/Message';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
export declare class InMemoryMessageRepository implements MessageRepository {
    private messages;
    findById(id: string): Promise<Message | null>;
    findByChatId(chatId: string): Promise<Message[]>;
    save(message: Message): Promise<Message>;
    delete(id: string): Promise<void>;
}
