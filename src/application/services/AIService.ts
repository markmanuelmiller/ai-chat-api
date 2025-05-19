import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { Message, MessageRole } from '@/domain/entities/Message';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';
import { MessageCreatedEvent } from '@/domain/events/impl/MessageCreatedEvent';
import { logger } from '@/utils/logger';
import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { VideoPipelineService } from '../ai/video-pipeline-service';
import { ChatAnthropic } from '@langchain/anthropic';
import { WebSocketManager } from '@/interfaces/ws/WebSocketManager';

// For a real implementation, you'd need to import StateGraph from @langchain/langgraph
// This is commented out to avoid TypeScript errors in this sample implementation
// import { StateGraph, END } from '@langchain/langgraph';

export class AIService {
  private llm: ChatAnthropic;
  private videoPipelineService: VideoPipelineService;

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly wsManager: WebSocketManager,
    private readonly config?: any
  ) {
    this.llm = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-latest",
      temperature: 0,
      ...(config.ANTHROPIC_API_KEY ? { apiKey: config.ANTHROPIC_API_KEY } : {})
    });
    
    // Initialize the LogAnalysisService with the same API key and WebSocket manager
    this.videoPipelineService = new VideoPipelineService(this.llm, this.wsManager);

    console.log('LANGCHAIN_TRACING_V2:', process.env.LANGCHAIN_TRACING_V2);
    console.log('LANGCHAIN_ENDPOINT:', process.env.LANGCHAIN_ENDPOINT);
    console.log('LANGCHAIN_API_KEY exists:', !!process.env.LANGCHAIN_API_KEY); // Log existence, not the key itself for security
    console.log('LANGCHAIN_PROJECT:', process.env.LANGCHAIN_PROJECT);
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
    const assistantResponse = await this.videoPipelineService.processMessage(chatId, userMessage);

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
    const videoPipelineService = this.videoPipelineService;

    async function* streamResponse() {
      try {
        // Stream from the LangGraph-based log analysis service
        const stream = videoPipelineService.streamResponse(chatId, userMessage);
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

  /**
   * In a real implementation, the below methods would be defined to handle the LangGraph nodes:
   * 
   * private defineDetectIntentNode() {...}
   * private defineRequestFiltersNode() {...}
   * private defineExtractOrRequestStreamNameNode() {...}
   * private defineHandleOtherIntentNode() {...}
   * private defineConfirmToolArgsNode() {...}
   * private defineExecuteLogToolNode() {...}
   * private defineAnalyzeLogsNode() {...}
   * private defineProposeNextStepNode() {...}
   * private defineProcessNextStepChoiceNode() {...}
   * private defineHandleToolErrorNode() {...}
   */
}
