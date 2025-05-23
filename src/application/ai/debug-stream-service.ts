import { Logger } from '@nestjs/common';
import { DebugStreamGraph } from './graphs/debug-stream-graph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StateAnnotation } from './graphs/debug-stream-graph';
import { StreamingMessageQueue, StreamableMessage } from '@/core/StreamingMessageQueue';

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
  async processMessage(chatId: string, userMessage: string): Promise<string> {
    try {
      const initialState: Partial<typeof StateAnnotation.State> = {
        message: userMessage,
        chatId,
      };

      this.logger.debug('processMessage initialState', initialState);
      
      const result = await this.graph.invoke(initialState);
      this.logger.debug('processMessage result from graph', result);
      return result.message;
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
    let accumulatedFinalReport = "";
    let currentState: Partial<typeof StateAnnotation.State> = {
      message: userMessage,
      chatId,
    };

    try {
      this.logger.debug(`[DebugStreamService] Initializing graph stream for session ${sessionId} with state:`, currentState);
      
      const stream = await this.graph.stream(
        currentState,
        { configurable: { interruptAfter: ["streamDebugDataCollectorNode"] } }
      );
      
      let hitlRequiredSent = false;

      for await (const chunk of stream) {
        this.logger.debug(`[DebugStreamService] Graph stream chunk for session ${sessionId}:`, chunk);

        let nodeThatProducedOutput: string | null = null;
        let specificNodeOutput: Record<string, any> | null = null;

        if (chunk && typeof chunk === 'object') {
            const nodeNames = Object.keys(chunk);
            if (nodeNames.length > 0) { // Check if there are any keys
                // We assume the relevant output is under the first key if multiple, 
                // or the only key if just one (typical for LangGraph node outputs in stream)
                nodeThatProducedOutput = nodeNames[0]; 
                specificNodeOutput = (chunk as Record<string, any>)[nodeThatProducedOutput];
                
                if (specificNodeOutput && typeof specificNodeOutput === 'object') {
                    // Update currentState with the output of the current node
                    currentState = { ...currentState, ...specificNodeOutput };
                } else if (nodeThatProducedOutput) {
                    // Handle cases where node output might not be an object to spread (e.g. just a value)
                    // This might need adjustment based on actual graph outputs not meant for spreading into state
                    currentState = { ...currentState, [nodeThatProducedOutput]: specificNodeOutput };
                }
            } else {
                 // If chunk is an empty object or not in {nodeName: output} format directly, 
                 // we might be receiving a direct state update or an event without a specific node key.
                 // For now, we assume if it's not keyed by node, it might be a direct state patch.
                 // This part is less common for LangGraph node-specific outputs.
                 currentState = { ...currentState, ...chunk }; 
            }
        }

        // Check for HITL condition specifically when streamDebugDataCollectorNode has output
        // and its output confirms humanConfirmation is null.
        if (nodeThatProducedOutput === 'streamDebugDataCollectorNode' && 
            specificNodeOutput && 
            specificNodeOutput.humanConfirmation === null && 
            specificNodeOutput.debugParams &&
            !hitlRequiredSent) {
            
          this.logger.log(`[DebugStreamService] HITL_REQUIRED for session ${sessionId} due to streamDebugDataCollectorNode. Data:`, specificNodeOutput.debugParams);
          queue.addMessage({
            type: 'HITL_REQUIRED',
            payload: {
              node: 'streamDebugDataCollectorNode',
              debugParams: specificNodeOutput.debugParams,
              resumeState: currentState, // Send the latest composite currentState which includes this node's output
            },
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
          });
          hitlRequiredSent = true;
          this.logger.log(`[DebugStreamService] Sent HITL_REQUIRED for session ${sessionId}. Stream will pause here.`);
          return "human_input_required"; // Return immediately
        }

        // Process messages from the current chunk for any node
        // The chunk itself is what we iterate over, assuming it's in {nodeName: outputData} format
        const chunkDataForLoop = chunk as Record<string, any>; 
        for (const nodeNameInLoop in chunkDataForLoop) {
          if (Object.prototype.hasOwnProperty.call(chunkDataForLoop, nodeNameInLoop)) {
            const nodeOutputInLoop = chunkDataForLoop[nodeNameInLoop];
            this.logger.debug(`[DebugStreamService] Processing output for node: ${nodeNameInLoop}, session: ${sessionId}`, nodeOutputInLoop);

            let nodeOutputProcessedForSpecificMessages = false;

            if (nodeOutputInLoop && Array.isArray(nodeOutputInLoop.streamingMessages) && nodeOutputInLoop.streamingMessages.length > 0) {
              this.logger.debug(`[DebugStreamService] Found streamingMessages in ${nodeNameInLoop} for session ${sessionId}`);
              for (const streamingMsg of nodeOutputInLoop.streamingMessages) {
                if (typeof streamingMsg === 'string') {
                  queue.addMessage({
                    type: 'GRAPH_MESSAGE',
                    payload: { node: nodeNameInLoop, message: streamingMsg },
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                  });
                }
              }
              nodeOutputProcessedForSpecificMessages = true;
            }

            if (nodeOutputInLoop && typeof nodeOutputInLoop.finalReport === 'string') {
              this.logger.debug(`[DebugStreamService] Found finalReport in ${nodeNameInLoop} for session ${sessionId}`);
              const llmReportContent = nodeOutputInLoop.finalReport;
              if (llmReportContent.length > accumulatedFinalReport.length) {
                const newContent = llmReportContent.substring(accumulatedFinalReport.length);
                accumulatedFinalReport = llmReportContent;
                queue.addMessage({
                  type: 'LLM_CHUNK',
                  payload: { node: nodeNameInLoop, chunk: newContent, fullReportSnapshot: llmReportContent },
                  timestamp: new Date().toISOString(),
                  sessionId: sessionId,
                });
              } else if (llmReportContent && llmReportContent !== accumulatedFinalReport) {
                accumulatedFinalReport = llmReportContent;
                 queue.addMessage({
                  type: 'LLM_CHUNK',
                  payload: { node: nodeNameInLoop, chunk: llmReportContent, fullReportSnapshot: llmReportContent },
                  timestamp: new Date().toISOString(),
                  sessionId: sessionId,
                });
              }
              nodeOutputProcessedForSpecificMessages = true;
            }

            if (nodeOutputInLoop && Object.keys(nodeOutputInLoop).length > 0) {
                 queue.addMessage({
                    type: 'NODE_OUTPUT',
                    payload: { node: nodeNameInLoop, data: nodeOutputInLoop },
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                });
            } else if (!nodeOutputProcessedForSpecificMessages) {
                 queue.addMessage({
                    type: 'NODE_SKIPPED_OR_EMPTY',
                    payload: { node: nodeNameInLoop, message: 'Node produced no output or was skipped.' },
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                });
            }
          }
        }
      } // End of for await
      
      this.logger.log(`[DebugStreamService] Graph stream (initial part) fully finished for session ${sessionId}. Accumulated: ${accumulatedFinalReport.length}`);
      
      if (hitlRequiredSent) {
        this.logger.warn(`[DebugStreamService] Fallback: HITL was sent, returning human_input_required after loop completion for session ${sessionId}.`);
        return "human_input_required";
      }

      return accumulatedFinalReport;

    } catch (error) {
      const errorTyped = error as Error;
      this.logger.error(`[DebugStreamService] Error in streamResponse for session ${sessionId}: ${errorTyped.message}`, errorTyped.stack);
      if (!queue.isClosed()) {
        queue.addMessage({
          type: 'ERROR',
          payload: { 
            source: 'DebugStreamService', 
            error: 'Error streaming graph response.', 
            details: errorTyped.message 
          },
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
        });
      }
      throw error; 
    }
  }

  /**
   * Resume a graph stream after human confirmation.
   * @param sessionId The session ID for attributing messages.
   * @param resumeState The state object received from the HITL_REQUIRED message.
   * @param userConfirmation The boolean confirmation from the user.
   * @param queue The message queue to push subsequent streamable messages to.
   * @returns A promise that resolves with the full final response string after resumption.
   */
  async resumeStreamWithConfirmation(
    sessionId: string,
    resumeState: typeof StateAnnotation.State, // Expecting the full state object
    userConfirmation: boolean,
    queue: StreamingMessageQueue
  ): Promise<string> {
    let accumulatedFinalReport = "";
    this.logger.log(`[DebugStreamService] Resuming graph stream for session ${sessionId} with userConfirmation: ${userConfirmation}`);

    if (!resumeState) {
      this.logger.error(`[DebugStreamService] ResumeState is missing for session ${sessionId}`);
      throw new Error('ResumeState is required to continue the stream.');
    }

    // Update the state with the user's confirmation AND the isResuming flag
    const updatedState: typeof StateAnnotation.State = {
      ...resumeState,
      humanConfirmation: userConfirmation,
      isResuming: true, // Set the flag for the resumed run
    };

    try {
      // Continue the graph stream from the updated state.
      // No specific interrupt config needed here unless there are further interrupt points.
      this.logger.debug(`[DebugStreamService] Calling graph.stream with updatedState for session ${sessionId}:`, updatedState);
      const stream = await this.graph.stream(updatedState);

      for await (const chunk of stream) {
        this.logger.debug(`[DebugStreamService] Resumed graph stream chunk for session ${sessionId}:`, chunk);

        const chunkData = chunk as Record<string, any>; 

        for (const nodeName in chunkData) {
          if (Object.prototype.hasOwnProperty.call(chunkData, nodeName)) {
            const nodeOutput = chunkData[nodeName];
            this.logger.debug(`[DebugStreamService] Processing output for node (resumed): ${nodeName}, session: ${sessionId}`, nodeOutput);

            let nodeOutputProcessedForSpecificMessages = false;

            if (nodeOutput && Array.isArray(nodeOutput.streamingMessages) && nodeOutput.streamingMessages.length > 0) {
              this.logger.debug(`[DebugStreamService] Found streamingMessages in ${nodeName} (resumed) for session ${sessionId}`);
              for (const streamingMsg of nodeOutput.streamingMessages) {
                if (typeof streamingMsg === 'string') {
                  queue.addMessage({
                    type: 'GRAPH_MESSAGE',
                    payload: { node: nodeName, message: streamingMsg },
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                  });
                }
              }
              nodeOutputProcessedForSpecificMessages = true;
            }

            if (nodeOutput && typeof nodeOutput.finalReport === 'string') {
              this.logger.debug(`[DebugStreamService] Found finalReport in ${nodeName} (resumed) for session ${sessionId}`);
              const llmReportContent = nodeOutput.finalReport;
              if (llmReportContent.length > accumulatedFinalReport.length) {
                const newContent = llmReportContent.substring(accumulatedFinalReport.length);
                accumulatedFinalReport = llmReportContent;
                queue.addMessage({
                  type: 'LLM_CHUNK',
                  payload: { node: nodeName, chunk: newContent, fullReportSnapshot: llmReportContent },
                  timestamp: new Date().toISOString(),
                  sessionId: sessionId,
                });
              } else if (llmReportContent && llmReportContent !== accumulatedFinalReport) {
                accumulatedFinalReport = llmReportContent;
                 queue.addMessage({
                  type: 'LLM_CHUNK',
                  payload: { node: nodeName, chunk: llmReportContent, fullReportSnapshot: llmReportContent },
                  timestamp: new Date().toISOString(),
                  sessionId: sessionId,
                });
              }
              nodeOutputProcessedForSpecificMessages = true;
            }

            if (nodeOutput && Object.keys(nodeOutput).length > 0) {
                 queue.addMessage({
                    type: 'NODE_OUTPUT',
                    payload: { node: nodeName, data: nodeOutput },
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                });
            } else if (!nodeOutputProcessedForSpecificMessages) {
                 queue.addMessage({
                    type: 'NODE_SKIPPED_OR_EMPTY',
                    payload: { node: nodeName, message: 'Node produced no output or was skipped.' },
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId,
                });
            }
          }
        }
      }
      this.logger.log(`[DebugStreamService] Resumed graph stream finished for session ${sessionId}. Accumulated final report length: ${accumulatedFinalReport.length}`);
      if (!accumulatedFinalReport && !queue.isClosed()) {
        this.logger.warn(`[DebugStreamService] No accumulated final report content for session ${sessionId} after resumed stream completion.`);
      }
      return accumulatedFinalReport;
    } catch (error) {
      const errorTyped = error as Error;
      this.logger.error(`[DebugStreamService] Error in resumed streamResponse for session ${sessionId}: ${errorTyped.message}`, errorTyped.stack);
      if (!queue.isClosed()) {
        queue.addMessage({
          type: 'ERROR',
          payload: { source: 'DebugStreamServiceResumed', error: 'Error streaming resumed graph response.', details: errorTyped.message },
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
        });
      }
      throw error;
    }
  }
} 