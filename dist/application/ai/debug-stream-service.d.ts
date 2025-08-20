import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StreamingMessageQueue } from '@/core/StreamingMessageQueue';
/**
 * Service for handling log analysis using LangGraph
 */
export declare class DebugStreamService {
    private readonly logger;
    private graph;
    constructor(llm: BaseChatModel, config: any);
    /**
     * Process a user message and generate a response
     * @param chatId Chat ID for the conversation
     * @param userMessage Message from the user to process
     * @returns The assistant's response
     */
    processMessage(chatId: string, userMessage: string): Promise<any>;
    /**
     * Stream a response to a user message by pushing events directly to a queue.
     * @param chatId Chat ID for the conversation
     * @param userMessage Message from the user to process
     * @param queue The message queue to push streamable messages to.
     * @param sessionId The session ID for attributing messages.
     * @returns A promise that resolves with the full final response string.
     */
    streamResponse(chatId: string, userMessage: string, queue: StreamingMessageQueue, sessionId: string): Promise<string>;
}
