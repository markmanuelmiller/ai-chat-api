import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { Message, MessageRole } from '@/domain/entities/Message';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';
import { MessageCreatedEvent } from '@/domain/events/impl/MessageCreatedEvent';
import { logger } from '@/utils/logger';

export class AIService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  // In a real implementation, this would integrate with LangChain and LangGraph
  async generateResponse(chatId: string, userMessage: string): Promise<Message> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Save the user message
    const userMessageEntity = Message.create({
      chatId,
      role: MessageRole.USER,
      content: userMessage,
    });
    await this.messageRepository.save(userMessageEntity);
    await this.eventEmitter.emit(
      new MessageCreatedEvent(
        userMessageEntity.id,
        chatId,
        MessageRole.USER,
        userMessageEntity.content,
      ),
    );

    // Here we would integrate with LangChain/LangGraph
    // For now, just mock a response
    const mockResponse = `This is a mock AI response to: "${userMessage}"`;

    // Save the assistant message
    const assistantMessage = Message.create({
      chatId,
      role: MessageRole.ASSISTANT,
      content: mockResponse,
    });
    const savedMessage = await this.messageRepository.save(assistantMessage);
    await this.eventEmitter.emit(
      new MessageCreatedEvent(savedMessage.id, chatId, MessageRole.ASSISTANT, savedMessage.content),
    );

    return savedMessage;
  }

  // This method would be used for streaming responses
  async streamResponse(chatId: string, userMessage: string): Promise<AsyncGenerator<string, void, unknown>> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Save the user message
    const userMessageEntity = Message.create({
      chatId,
      role: MessageRole.USER,
      content: userMessage,
    });
    await this.messageRepository.save(userMessageEntity);
    await this.eventEmitter.emit(
      new MessageCreatedEvent(
        userMessageEntity.id,
        chatId,
        MessageRole.USER,
        userMessageEntity.content,
      ),
    );

    // Store references to instance properties needed in the generator
    const messageRepository = this.messageRepository;
    const eventEmitter = this.eventEmitter;

    // Mock streaming for now
    // In a real implementation, this would stream from LangChain/LangGraph
    async function* mockStream() {
      const words = `This is a mock streaming AI response to: "${userMessage}"`.split(' ');
      let fullResponse = '';

      for (const word of words) {
        fullResponse += word + ' ';
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Save the full response
      const assistantMessage = Message.create({
        chatId,
        role: MessageRole.ASSISTANT,
        content: fullResponse.trim(),
      });
      await messageRepository.save(assistantMessage);
      await eventEmitter.emit(
        new MessageCreatedEvent(
          assistantMessage.id,
          chatId,
          MessageRole.ASSISTANT,
          assistantMessage.content,
        ),
      );
    }

    return mockStream();
  }
}
