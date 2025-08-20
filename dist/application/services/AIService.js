"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const Message_1 = require("@/domain/entities/Message");
const MessageCreatedEvent_1 = require("@/domain/events/impl/MessageCreatedEvent");
const logger_1 = require("@/utils/logger");
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
const debug_stream_service_1 = require("../ai/debug-stream-service");
const anthropic_1 = require("@langchain/anthropic");
const Chat_1 = require("@/domain/entities/Chat");
class AIService {
    constructor(chatRepository, messageRepository, eventEmitter, config, webSocketManager) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        this.eventEmitter = eventEmitter;
        this.config = config;
        this.webSocketManager = webSocketManager;
        this.llm = new anthropic_1.ChatAnthropic({
            modelName: "claude-3-7-sonnet-latest",
            temperature: 0,
            ...(config.ANTHROPIC_API_KEY ? { apiKey: config.ANTHROPIC_API_KEY } : {})
        });
        // Initialize the LogAnalysisService with the same API key and WebSocket manager
        this.debugStreamService = new debug_stream_service_1.DebugStreamService(this.llm, config);
    }
    async generateResponse(chatId, userMessage) {
        const chat = await this.chatRepository.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }
        // Save the user message
        const userMessageEntity = Message_1.Message.create({
            chatId,
            role: Message_1.MessageRole.USER,
            content: userMessage,
        });
        await this.messageRepository.save(userMessageEntity);
        await this.eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(userMessageEntity.id, chatId, Message_1.MessageRole.USER, userMessageEntity.content));
        // Use the LangGraph-based log analysis service
        const assistantResponse = await this.debugStreamService.processMessage(chatId, userMessage);
        // Save the assistant message
        const assistantMessage = Message_1.Message.create({
            chatId,
            role: Message_1.MessageRole.ASSISTANT,
            content: assistantResponse,
        });
        const savedMessage = await this.messageRepository.save(assistantMessage);
        await this.eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(savedMessage.id, chatId, Message_1.MessageRole.ASSISTANT, savedMessage.content));
        return savedMessage;
    }
    async streamResponse(chatId, userId, userMessage) {
        const sessionId = chatId;
        const queue = this.webSocketManager.getOrCreateQueue(sessionId);
        let chat = await this.chatRepository.findById(chatId);
        if (!chat) {
            // Auto-create the chat if it doesn't exist
            chat = Chat_1.Chat.create({
                id: chatId,
                userId,
                title: 'New Conversation',
            });
            await this.chatRepository.save(chat);
        }
        const userMessageEntity = Message_1.Message.create({
            chatId,
            role: Message_1.MessageRole.USER,
            content: userMessage,
        });
        await this.messageRepository.save(userMessageEntity);
        await this.eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(userMessageEntity.id, chatId, Message_1.MessageRole.USER, userMessageEntity.content));
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
                    const assistantMessage = Message_1.Message.create({
                        chatId,
                        role: Message_1.MessageRole.ASSISTANT,
                        content: fullResponse.trim(),
                    });
                    await messageRepository.save(assistantMessage);
                    await eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(assistantMessage.id, chatId, Message_1.MessageRole.ASSISTANT, assistantMessage.content));
                    // Send stream end message with the final response
                    queue.addMessage({
                        type: 'STREAM_END',
                        payload: { message: 'AI processing finished.', finalResponse: fullResponse.trim() },
                        timestamp: new Date().toISOString(),
                        sessionId: sessionId,
                    });
                }
                else {
                    // If fullResponse is empty, it means DebugStreamService didn't produce a final string.
                    // This might be normal if the graph only sends other types of messages (e.g. status updates)
                    // or an error might have occurred (which DebugStreamService would have pushed to queue).
                    logger_1.logger.info(`AI processing for session ${sessionId} finished without a final textual response.`);
                    // Send a different type of STREAM_END or rely on the queue being closed.
                    queue.addMessage({
                        type: 'STREAM_END',
                        payload: { message: 'AI processing finished without a final textual response.' },
                        timestamp: new Date().toISOString(),
                        sessionId: sessionId,
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Error during AI response streaming:', error);
                const errorTyped = error;
                const errorMsg = {
                    type: 'ERROR',
                    payload: { error: 'Sorry, I encountered an error processing your request.', details: errorTyped.message },
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                };
                queue.addMessage(errorMsg);
            }
            finally {
                queue.close();
            }
        })();
        return Promise.resolve();
    }
    /**
     * This method provides a simpler fallback implementation using just LangChain without the graph
     * It's useful in case the graph implementation has issues
     */
    async simpleLangchainResponse(chatId, userMessage) {
        const promptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
            ["system", "You are a log analysis assistant. Analyze the user's request and provide an appropriate response."],
            ["human", "{userMessage}"]
        ]);
        const chain = runnables_1.RunnableSequence.from([
            runnables_1.RunnableLambda.from(({ userMessage }) => ({ userMessage })),
            promptTemplate,
            this.llm
        ]);
        // Process the request
        const result = await chain.invoke({ userMessage });
        return typeof result.content === 'string'
            ? result.content
            : JSON.stringify(result.content) || "I couldn't process your request.";
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService.js.map