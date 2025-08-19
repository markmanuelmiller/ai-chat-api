import { Chat, ChatProps } from '@/domain/entities/Chat';
import { ChatRepository } from '@/domain/repositories/ChatRepository';

export class InMemoryChatRepository implements ChatRepository {
  private chats: Map<string, Chat> = new Map();

  async findById(id: string): Promise<Chat | null> {
    return this.chats.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .filter(chat => chat.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async save(chat: Chat): Promise<Chat> {
    this.chats.set(chat.id, chat);
    return chat;
  }

  async delete(id: string): Promise<void> {
    this.chats.delete(id);
  }
}
