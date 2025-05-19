import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { Message, MessageRole } from '@/domain/entities/Message';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';
import { MessageCreatedEvent } from '@/domain/events/impl/MessageCreatedEvent';
import { logger } from '@/utils/logger';
import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { DebugStreamService } from '../ai/debug-stream-service';
import { ChatAnthropic } from '@langchain/anthropic';

export class AIService {
  private llm: ChatAnthropic;
  private debugStreamService: DebugStreamService;

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly config?: any
  ) {
    this.llm = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-latest",
      temperature: 0,
      ...(config.ANTHROPIC_API_KEY ? { apiKey: config.ANTHROPIC_API_KEY } : {})
    });
    
    // Initialize the LogAnalysisService with the same API key and WebSocket manager
    this.debugStreamService = new DebugStreamService(this.llm, config);
  }

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

    // Use the LangGraph-based log analysis service
    const assistantResponse = await this.debugStreamService.processMessage(chatId, userMessage);

    // Save the assistant message
    const assistantMessage = Message.create({
      chatId,
      role: MessageRole.ASSISTANT,
      content: assistantResponse,
    });
    const savedMessage = await this.messageRepository.save(assistantMessage);
    await this.eventEmitter.emit(
      new MessageCreatedEvent(savedMessage.id, chatId, MessageRole.ASSISTANT, savedMessage.content),
    );

    return savedMessage;
  }

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
    const debugStreamService = this.debugStreamService;

    async function* streamResponse() {
      try {
        // Stream from the LangGraph-based log analysis service
        const stream = debugStreamService.streamResponse(chatId, userMessage);
        let fullResponse = '';
        
        for await (const chunk of stream) {
          fullResponse += chunk;
          yield chunk;
        }
        
        // Save the complete response
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
      } catch (error) {
        logger.error('Error streaming response:', error);
        yield "Sorry, I encountered an error processing your request.";
      }
    }

    return streamResponse();
  }
  
  
  /**
   * This method provides a simpler fallback implementation using just LangChain without the graph
   * It's useful in case the graph implementation has issues
   */
  async simpleLangchainResponse(chatId: string, userMessage: string): Promise<string> {
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", "You are a log analysis assistant. Analyze the user's request and provide an appropriate response."],
      ["human", "{userMessage}"]
    ]);
    
    const chain = RunnableSequence.from([
      RunnableLambda.from(({userMessage}: {userMessage: string}) => ({userMessage})),
      promptTemplate,
      this.llm
    ]);
    
    // Process the request
    const result = await chain.invoke({userMessage});
    return typeof result.content === 'string' 
      ? result.content 
      : JSON.stringify(result.content) || "I couldn't process your request.";
  }
}
