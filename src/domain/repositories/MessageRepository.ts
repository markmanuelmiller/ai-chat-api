import { Message } from '@/domain/entities/Message';

export interface MessageRepository {
  findById(id: string): Promise<Message | null>;
  findByChatId(chatId: string): Promise<Message[]>;
  save(message: Message): Promise<Message>;
  delete(id: string): Promise<void>;
}
