import { Logger } from '@nestjs/common';
import { DebugStreamGraph } from '@/application/ai/graphs/debug-stream-graph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StateAnnotation } from '@/application/ai/graphs/debug-stream-graph';
import { StreamingMessageQueue } from '@/core/StreamingMessageQueue';

/**
 * Service for handling log analysis using LangGraph
 */

export class DebugStreamService {
  private readonly logger = new Logger(DebugStreamService.name);
  private graph: DebugStreamGraph;
  
  constructor(
    llm: BaseChatModel,
    config: any
  ) {
    this.graph = new DebugStreamGraph(llm, config);
  }
  
  /**
   * Process a user message and generate a response
   * @param chatId Chat ID for the conversation
   * @param userMessage Message from the user to process
   * @returns The assistant's response
   */
  async processMessage(chatId: string, userMessage: string): Promise<any> {
    try {
      const initialState: Partial<typeof StateAnnotation.State> = {
        message: userMessage,
        chatId,
      };

      this.logger.debug('processMessage initialState', initialState);
      
      const result = await this.graph.invoke(initialState);
      this.logger.debug('processMessage result from graph', result);
      return result;
    } catch (error) {
      this.logger.error('Error processing message:', error);
      return "Sorry, I encountered an error processing your request.";
    }
  }
  
  /**
   * Stream a response to a user message by pushing events directly to a queue.
   * @param chatId Chat ID for the conversation
   * @param userMessage Message from the user to process
   * @param queue The message queue to push streamable messages to.
   * @returns A promise that resolves with the full final response string.
   */
  async streamResponse(
    chatId: string, 
    userMessage: string, 
    queue: StreamingMessageQueue
  ): Promise<string> {
    let finalResult = ""; // Tracks the final result content

    try {
      const initialState: Partial<typeof StateAnnotation.State> = {
        message: userMessage,
        chatId,
      };
      
      this.logger.debug(`[DebugStreamService] Initializing graph stream for chat ${chatId} with state:`, initialState);
      const stream = await this.graph.stream(initialState);
      
      for await (const chunk of stream) {
        this.logger.debug(`[DebugStreamService] Graph stream chunk for chat ${chatId}:`, chunk);

        // Cast chunk to Record<string, any> to handle dynamic nodeName keys
        const chunkData = chunk as Record<string, any>; 

        for (const nodeName in chunkData) {
          if (Object.prototype.hasOwnProperty.call(chunkData, nodeName)) {
            const nodeOutput = chunkData[nodeName];
            this.logger.debug(`[DebugStreamService] Processing output for node: ${nodeName}, chat: ${chatId}`, nodeOutput);

            // Handle error messages
            if (nodeOutput && typeof nodeOutput.error === 'string' && nodeOutput.error.trim()) {
              this.logger.debug(`[DebugStreamService] Found error in ${nodeName} for chat ${chatId}`);
              queue.addMessage({
                type: 'ERROR',
                chatId: chatId,
                timestamp: new Date().toISOString(),
                payload: {
                  node: nodeName,
                  message: nodeOutput.error,
                },
              });
              this.logger.debug(`[DebugStreamService] Queued ERROR from ${nodeName}: "${nodeOutput.error}", chat: ${chatId}`);
            }
            // Handle streaming messages
            else if (nodeOutput && typeof nodeOutput.streamingMessage === 'string' && nodeOutput.streamingMessage.trim()) {
              this.logger.debug(`[DebugStreamService] Found streamingMessage in ${nodeName} for chat ${chatId}`);
              queue.addMessage({
                type: 'GRAPH_MESSAGE',
                chatId: chatId,
                timestamp: new Date().toISOString(),
                payload: {
                  node: nodeName,
                  message: nodeOutput.streamingMessage,
                },
              });
              this.logger.debug(`[DebugStreamService] Queued GRAPH_MESSAGE from ${nodeName}: "${nodeOutput.streamingMessage}", chat: ${chatId}`);
            }
            // Handle result content
            else if (nodeOutput && typeof nodeOutput.result === 'string' && nodeOutput.result.trim()) {
              this.logger.debug(`[DebugStreamService] Found result in ${nodeName} for chat ${chatId}`);
              const resultContent = nodeOutput.result;
              
              // Update final result and send the complete result content
              finalResult = resultContent;
              queue.addMessage({
                type: 'NODE_OUTPUT',
                chatId: chatId,
                timestamp: new Date().toISOString(),
                payload: {
                  node: nodeName,
                  message: resultContent,
                },
              });
              this.logger.debug(`[DebugStreamService] Queued NODE_OUTPUT from ${nodeName}, content length: ${resultContent.length}, chat: ${chatId}`);
            }
          }
        }
      }
      
      return finalResult;

    } catch (error) {
      const errorTyped = error as Error;
      this.logger.error(`[DebugStreamService] Error in streamResponse for chat ${chatId}: ${errorTyped.message}`, errorTyped.stack);
      if (!queue.isClosed()) {
        queue.addMessage({
          type: 'ERROR',
          chatId: chatId,
          timestamp: new Date().toISOString(),
          payload: { 
            node: 'DebugStreamService', 
            message: `Error streaming graph response: ${errorTyped.message}`,
          }
        });
      }
      throw error; 
    }
  }
} 