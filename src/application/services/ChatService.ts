import { Chat } from '@/domain/entities/Chat';
import { Message, MessageRole } from '@/domain/entities/Message';
import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { ChatCreatedEvent } from '@/domain/events/impl/ChatCreatedEvent';
import { MessageCreatedEvent } from '@/domain/events/impl/MessageCreatedEvent';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';
import { logger } from '@/utils/logger';

export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async createChat(userId: string, title: string): Promise<Chat> {
    const chat = Chat.create({
      userId,
      title,
    });

    const savedChat = await this.chatRepository.save(chat);
    await this.eventEmitter.emit(new ChatCreatedEvent(savedChat.id, userId));

    return savedChat;
  }

  async getChats(userId: string): Promise<Chat[]> {
    return this.chatRepository.findByUserId(userId);
  }

  async getChatById(chatId: string): Promise<Chat | null> {
    return this.chatRepository.findById(chatId);
  }

  async updateChatTitle(chatId: string, title: string): Promise<Chat> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    chat.updateTitle(title);
    return this.chatRepository.save(chat);
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.chatRepository.delete(chatId);
  }

  async getMessages(chatId: string): Promise<Message[]> {
    return this.messageRepository.findByChatId(chatId);
  }

  async addMessage(chatId: string, role: MessageRole, content: string): Promise<Message> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const message = Message.create({
      chatId,
      role,
      content,
    });

    const savedMessage = await this.messageRepository.save(message);
    await this.eventEmitter.emit(
      new MessageCreatedEvent(savedMessage.id, chatId, role, content),
    );

    return savedMessage;
  }
}
