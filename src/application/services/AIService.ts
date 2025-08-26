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
import { Chat } from '@/domain/entities/Chat';

export class AIService {
  private llm: ChatAnthropic;
  private debugStreamService: DebugStreamService;

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly config: any,
    private readonly webSocketManager: WebSocketManager,
  ) {
    this.llm = new ChatAnthropic({
      model: "claude-sonnet-4-20250514",
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

  async streamResponse(chatId: string, userId: string, userMessage: string): Promise<void> {
    const sessionId = chatId;
    const queue = this.webSocketManager.getOrCreateQueue(sessionId);

    let chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      // Auto-create the chat if it doesn't exist
      chat = Chat.create({
        id: chatId,
        userId,
        title: 'New Conversation',
      });
      await this.chatRepository.save(chat);
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

        // Call the modified debugStreamService.streamResponse
        // It now pushes to the queue directly and returns the full response string.
        fullResponse = await debugStreamService.streamResponse(chatId, userMessage, queue, sessionId);
        
        // The loop for (const chunk of stream) is removed from AIService as it's now in DebugStreamService

        // Save the complete response (if fullResponse is not empty)
        if (fullResponse && fullResponse.trim()) {
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

          // Send stream end message with the final response
          queue.addMessage({
            type: 'STREAM_END',
            payload: { message: 'AI processing finished.', finalResponse: fullResponse.trim() },
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
          });
        } else {
          // If fullResponse is empty, it means DebugStreamService didn't produce a final string.
          // This might be normal if the graph only sends other types of messages (e.g. status updates)
          // or an error might have occurred (which DebugStreamService would have pushed to queue).
          logger.info(`AI processing for session ${sessionId} finished without a final textual response.`);
          // Send a different type of STREAM_END or rely on the queue being closed.
          queue.addMessage({
            type: 'STREAM_END',
            payload: { message: 'AI processing finished without a final textual response.' },
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
        queue.close();
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
    
    // Process the request
    const result = await chain.invoke({userMessage});
    return typeof result.content === 'string' 
      ? result.content 
      : JSON.stringify(result.content) || "I couldn't process your request.";
  }
}
