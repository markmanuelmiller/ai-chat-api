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
import { WebSocketManager } from '@/interfaces/ws/WebSocketManager';
import { StreamableMessage } from '@/core/StreamingMessageQueue';
import { StateAnnotation } from '../ai/graphs/debug-stream-graph';

export class AIService {
  private llm: ChatAnthropic;
  private debugStreamService: DebugStreamService;
  private readonly chatRepository: ChatRepository;
  private readonly messageRepository: MessageRepository;
  private readonly eventEmitter: DomainEventEmitter;
  private readonly config: any;
  private webSocketManager!: WebSocketManager;

  constructor(
    chatRepository: ChatRepository,
    messageRepository: MessageRepository,
    eventEmitter: DomainEventEmitter,
    config: any,
  ) {
    this.chatRepository = chatRepository;
    this.messageRepository = messageRepository;
    this.eventEmitter = eventEmitter;
    this.config = config;

    this.llm = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-latest", // Or your model
      temperature: 0,
      ...(config.ANTHROPIC_API_KEY ? { apiKey: config.ANTHROPIC_API_KEY } : {})
    });
    
    this.debugStreamService = new DebugStreamService(this.llm, this.config);
  }

  public setWebSocketManager(webSocketManager: WebSocketManager): void {
    this.webSocketManager = webSocketManager;
  }

  async generateResponse(chatId: string, userMessage: string): Promise<Message> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
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
    const assistantResponse = await this.debugStreamService.processMessage(chatId, userMessage);
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

  async streamResponse(chatId: string, userId: string, userMessage: string): Promise<void> {
    const sessionId = chatId;
    const queue = this.webSocketManager.getOrCreateQueue(sessionId);

    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      const errorMsg: StreamableMessage = {
        type: 'ERROR',
        payload: { error: 'Chat not found' },
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
      };
      queue.addMessage(errorMsg);
      queue.close();
      throw new Error('Chat not found');
    }

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

    const messageRepository = this.messageRepository;
    const eventEmitter = this.eventEmitter;
    const debugStreamService = this.debugStreamService;

    (async () => {
      let fullResponse = '';
      try {
        queue.addMessage({
          type: 'STREAM_START',
          payload: { message: 'AI processing started.' },
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
        });
        fullResponse = await debugStreamService.streamResponse(chatId, userMessage, queue, sessionId);
        
        if (fullResponse && fullResponse.trim() && fullResponse !== "human_input_required") {
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
          queue.addMessage({
            type: 'STREAM_END',
            payload: { message: 'AI processing finished.', finalResponse: fullResponse.trim() },
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
          });
        } else if (fullResponse !== "human_input_required") { 
          logger.info(`AI processing for session ${sessionId} finished without a final textual response (or was HITL).`);
          queue.addMessage({
            type: 'STREAM_END',
            payload: { message: 'AI processing finished without a final textual response (or requires human input).' },
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
          });
        }
      } catch (error) {
        logger.error('Error during AI response streaming:', error);
        const errorTyped = error as Error;
        const errorMsg: StreamableMessage = {
          type: 'ERROR',
          payload: { error: 'Sorry, I encountered an error processing your request.', details: errorTyped.message },
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
        };
        queue.addMessage(errorMsg);
      } finally {
        if (fullResponse !== "human_input_required" && !queue.isClosed()) {
            logger.info(`[AIService] Closing queue for session ${sessionId} after initial stream response flow.`);
            queue.close();
        }
      }
    })();

    return Promise.resolve();
  }
  
  async resumeDebugStream(sessionId: string, resumeState: typeof StateAnnotation.State, userConfirmation: boolean): Promise<void> {
    const queue = this.webSocketManager.getOrCreateQueue(sessionId);
    logger.info(`[AIService] Attempting to resume debug stream for session ${sessionId} with userConfirmation: ${userConfirmation}`);

    const messageRepository = this.messageRepository;
    const eventEmitter = this.eventEmitter;
    const debugStreamService = this.debugStreamService;
    const chatId = sessionId; 

    if (queue.isClosed()) {
        logger.warn(`[AIService] Queue for session ${sessionId} is already closed. Cannot resume.`);
        return Promise.resolve();
    }

    (async () => {
      let fullResponse = '';
      try {
        fullResponse = await debugStreamService.resumeStreamWithConfirmation(sessionId, resumeState, userConfirmation, queue);
        
        if (fullResponse && fullResponse.trim() && fullResponse !== "human_input_required") {
          logger.info(`[AIService] Resumed stream for session ${sessionId} produced full response: ${fullResponse.length} chars`);
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

          queue.addMessage({
            type: 'STREAM_END',
            payload: { message: 'AI processing finished after resume.', finalResponse: fullResponse.trim() },
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
          });
        } else if (fullResponse === "human_input_required") {
          logger.warn(`[AIService] Resumed stream for session ${sessionId} unexpectedly requires human input again.`);
           queue.addMessage({
            type: 'STREAM_END',
            payload: { message: 'AI processing paused again unexpectedly.' }, 
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
          });
        } else {
          logger.info(`[AIService] Resumed stream for session ${sessionId} finished without a final textual response.`);
          queue.addMessage({
            type: 'STREAM_END',
            payload: { message: 'AI processing finished after resume without a final textual response.' },
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
          });
        }

      } catch (error) {
        logger.error(`[AIService] Error during resumed AI response streaming for session ${sessionId}:`, error);
        const errorTyped = error as Error;
        const errorMsg: StreamableMessage = {
          type: 'ERROR',
          payload: { error: 'Sorry, I encountered an error processing your resumed request.', details: errorTyped.message },
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
        };
        queue.addMessage(errorMsg);
      } finally {
        if (fullResponse !== "human_input_required" && !queue.isClosed()) {
            logger.info(`[AIService] Closing queue for session ${sessionId} after resume flow.`);
            queue.close();
        }
      }
    })();

    return Promise.resolve();
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
    
    const result = await chain.invoke({userMessage});
    return typeof result.content === 'string' 
      ? result.content 
      : JSON.stringify(result.content) || "I couldn't process your request.";
  }
}
