import { Message, MessageProps, MessageRole } from '@/domain/entities/Message';
import { MessageRepository } from '@/domain/repositories/MessageRepository';

export class InMemoryMessageRepository implements MessageRepository {
  private messages: Map<string, Message> = new Map();

  async findById(id: string): Promise<Message | null> {
    return this.messages.get(id) || null;
  }

  async findByChatId(chatId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async save(message: Message): Promise<Message> {
    this.messages.set(message.id, message);
    return message;
  }

  async delete(id: string): Promise<void> {
    this.messages.delete(id);
  }
}
