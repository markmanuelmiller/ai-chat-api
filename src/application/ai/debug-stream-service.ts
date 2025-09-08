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
   * @param sessionId The session ID for attributing messages.
   * @returns A promise that resolves with the full final response string.
   */
  async streamResponse(
    chatId: string, 
    userMessage: string, 
    queue: StreamingMessageQueue, 
    sessionId: string
  ): Promise<string> {
    let accumulatedResult = ""; // Accumulates the final result content

    try {
      const initialState: Partial<typeof StateAnnotation.State> = {
        message: userMessage,
        chatId,
      };
      
      this.logger.debug(`[DebugStreamService] Initializing graph stream for session ${sessionId} with state:`, initialState);
      const stream = await this.graph.stream(initialState);
      
      for await (const chunk of stream) {
        this.logger.debug(`[DebugStreamService] Graph stream chunk for session ${sessionId}:`, chunk);

        // Cast chunk to Record<string, any> to handle dynamic nodeName keys
        const chunkData = chunk as Record<string, any>; 

        for (const nodeName in chunkData) {
          if (Object.prototype.hasOwnProperty.call(chunkData, nodeName)) {
            const nodeOutput = chunkData[nodeName];
            this.logger.debug(`[DebugStreamService] Processing output for node: ${nodeName}, session: ${sessionId}`, nodeOutput);

            // Handle error messages
            if (nodeOutput && typeof nodeOutput.error === 'string' && nodeOutput.error.trim()) {
              this.logger.debug(`[DebugStreamService] Found error in ${nodeName} for session ${sessionId}`);
              queue.addMessage({
                type: 'ERROR',
                chatId: chatId,
                timestamp: new Date().toISOString(),
                payload: {
                  node: nodeName,
                  message: nodeOutput.error,
                },
                sessionId: sessionId,
              });
              this.logger.debug(`[DebugStreamService] Queued ERROR from ${nodeName}: "${nodeOutput.error}", session: ${sessionId}`);
            }
            // Handle streaming messages
            else if (nodeOutput && typeof nodeOutput.streamingMessage === 'string' && nodeOutput.streamingMessage.trim()) {
              this.logger.debug(`[DebugStreamService] Found streamingMessage in ${nodeName} for session ${sessionId}`);
              queue.addMessage({
                type: 'GRAPH_MESSAGE',
                chatId: chatId,
                timestamp: new Date().toISOString(),
                payload: {
                  node: nodeName,
                  message: nodeOutput.streamingMessage,
                },
                sessionId: sessionId,
              });
              this.logger.debug(`[DebugStreamService] Queued GRAPH_MESSAGE from ${nodeName}: "${nodeOutput.streamingMessage}", session: ${sessionId}`);
            }
            // Handle result content
            else if (nodeOutput && typeof nodeOutput.result === 'string' && nodeOutput.result.trim()) {
              this.logger.debug(`[DebugStreamService] Found result in ${nodeName} for session ${sessionId}`);
              const resultContent = nodeOutput.result;

              // If the result field contains new content, send the new part
              if (resultContent.length > accumulatedResult.length) {
                const newContent = resultContent.substring(accumulatedResult.length);
                accumulatedResult = resultContent; // Update the main accumulator for the service's return value
                
                queue.addMessage({
                  type: 'NODE_OUTPUT',
                  chatId: chatId,
                  timestamp: new Date().toISOString(),
                  payload: {
                    node: nodeName,
                    message: newContent,
                  },
                  sessionId: sessionId,
                });
                this.logger.debug(`[DebugStreamService] Queued NODE_OUTPUT from ${nodeName}, new content length: ${newContent.length}, session: ${sessionId}`);
              } else if (resultContent && resultContent !== accumulatedResult) {
                // Handle case where result is different but not longer (could be a correction or new stream)
                accumulatedResult = resultContent;
                queue.addMessage({
                  type: 'NODE_OUTPUT',
                  chatId: chatId,
                  timestamp: new Date().toISOString(),
                  payload: {
                    node: nodeName,
                    message: resultContent,
                  },
                  sessionId: sessionId,
                });
                this.logger.debug(`[DebugStreamService] Queued NODE_OUTPUT (full snapshot) from ${nodeName}, length: ${resultContent.length}, session: ${sessionId}`);
              }
            }
            // Handle nodes with no specific output
            else if (nodeOutput && Object.keys(nodeOutput).length === 0) {
              this.logger.debug(`[DebugStreamService] Node ${nodeName} had empty output, session: ${sessionId}`);
              queue.addMessage({
                type: 'GRAPH_MESSAGE',
                chatId: chatId,
                timestamp: new Date().toISOString(),
                payload: {
                  node: nodeName,
                  message: 'Node completed with no output.',
                },
                sessionId: sessionId,
              });
            }
          }
        }
      }
      
      this.logger.log(`[DebugStreamService] Graph stream finished for session ${sessionId}. Accumulated result length: ${accumulatedResult.length}`);
      if (!accumulatedResult && !queue.isClosed()) {
        this.logger.warn(`[DebugStreamService] No accumulated result content for session ${sessionId} after stream completion.`);
      }
      return accumulatedResult;

    } catch (error) {
      const errorTyped = error as Error;
      this.logger.error(`[DebugStreamService] Error in streamResponse for session ${sessionId}: ${errorTyped.message}`, errorTyped.stack);
      if (!queue.isClosed()) {
        queue.addMessage({
          type: 'ERROR',
          chatId: chatId,
          timestamp: new Date().toISOString(),
          payload: { 
            node: 'DebugStreamService', 
            message: `Error streaming graph response: ${errorTyped.message}`,
          },
          sessionId: sessionId,
        });
      }
      throw error; 
    }
  }
} 