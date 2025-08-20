"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugStreamService = void 0;
const common_1 = require("@nestjs/common");
const debug_stream_graph_1 = require("./graphs/debug-stream-graph");
/**
 * Service for handling log analysis using LangGraph
 */
class DebugStreamService {
    constructor(llm, config) {
        this.logger = new common_1.Logger(DebugStreamService.name);
        this.graph = new debug_stream_graph_1.DebugStreamGraph(llm, config);
    }
    /**
     * Process a user message and generate a response
     * @param chatId Chat ID for the conversation
     * @param userMessage Message from the user to process
     * @returns The assistant's response
     */
    async processMessage(chatId, userMessage) {
        try {
            const initialState = {
                message: userMessage,
                chatId,
            };
            this.logger.debug('processMessage initialState', initialState);
            const result = await this.graph.invoke(initialState);
            this.logger.debug('processMessage result from graph', result);
            return result;
        }
        catch (error) {
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
    async streamResponse(chatId, userMessage, queue, sessionId) {
        let accumulatedFinalReport = ""; // Accumulates the final report content from an LLM
        try {
            const initialState = {
                message: userMessage,
                chatId,
            };
            this.logger.debug(`[DebugStreamService] Initializing graph stream for session ${sessionId} with state:`, initialState);
            const stream = await this.graph.stream(initialState);
            for await (const chunk of stream) {
                this.logger.debug(`[DebugStreamService] Graph stream chunk for session ${sessionId}:`, chunk);
                // Cast chunk to Record<string, any> to handle dynamic nodeName keys
                const chunkData = chunk;
                for (const nodeName in chunkData) {
                    if (Object.prototype.hasOwnProperty.call(chunkData, nodeName)) {
                        const nodeOutput = chunkData[nodeName];
                        this.logger.debug(`[DebugStreamService] Processing output for node: ${nodeName}, session: ${sessionId}`, nodeOutput);
                        let nodeOutputProcessedForSpecificMessages = false;
                        // 1. Handle 'streamingMessages' (simple text updates from any node)
                        if (nodeOutput && Array.isArray(nodeOutput.streamingMessages) && nodeOutput.streamingMessages.length > 0) {
                            this.logger.debug(`[DebugStreamService] Found streamingMessages in ${nodeName} for session ${sessionId}`);
                            for (const streamingMsg of nodeOutput.streamingMessages) {
                                if (typeof streamingMsg === 'string') {
                                    queue.addMessage({
                                        type: 'GRAPH_MESSAGE',
                                        payload: {
                                            node: nodeName,
                                            message: streamingMsg,
                                        },
                                        timestamp: new Date().toISOString(),
                                        sessionId: sessionId,
                                    });
                                    this.logger.debug(`[DebugStreamService] Queued GRAPH_MESSAGE from ${nodeName}: "${streamingMsg}", session: ${sessionId}`);
                                }
                            }
                            nodeOutputProcessedForSpecificMessages = true;
                        }
                        // 2. Handle 'finalReport' (typically from an LLM node, e.g., generateFinalReportNode)
                        // This part assumes 'finalReport' contains the text from an LLM.
                        // If your LLM streams tokens into a different field, adjust this.
                        if (nodeOutput && typeof nodeOutput.finalReport === 'string') {
                            this.logger.debug(`[DebugStreamService] Found finalReport in ${nodeName} for session ${sessionId}`);
                            const llmReportContent = nodeOutput.finalReport;
                            // If the finalReport field contains the *entire* report up to this point,
                            // we send the new part. If it's just a token/chunk, this logic might be too simple,
                            // but usually for a field named "finalReport" it's the full text.
                            // Based on your logs, finalReport in generateFinalReportNode appears as a complete block.
                            if (llmReportContent.length > accumulatedFinalReport.length) {
                                const newContent = llmReportContent.substring(accumulatedFinalReport.length);
                                accumulatedFinalReport = llmReportContent; // Update the main accumulator for the service's return value
                                queue.addMessage({
                                    type: 'LLM_CHUNK', // Or 'FINAL_REPORT_CHUNK' or 'FINAL_REPORT_UPDATE'
                                    payload: {
                                        node: nodeName,
                                        chunk: newContent, // Send the new part
                                        fullReportSnapshot: llmReportContent // Optionally send the full snapshot too
                                    },
                                    timestamp: new Date().toISOString(),
                                    sessionId: sessionId,
                                });
                                this.logger.debug(`[DebugStreamService] Queued LLM_CHUNK from ${nodeName}, new content length: ${newContent.length}, session: ${sessionId}`);
                            }
                            else if (llmReportContent && llmReportContent !== accumulatedFinalReport) {
                                // This case implies the report might not be purely additive or was reset.
                                // For simplicity, if it's different and not shorter, send it as a new chunk/snapshot.
                                // Or if it *is* shorter, it might be a correction or a new stream.
                                // For now, let's assume it means it's a new complete version if not longer.
                                accumulatedFinalReport = llmReportContent; // Reset accumulator to this new version
                                queue.addMessage({
                                    type: 'LLM_CHUNK', // Or 'FINAL_REPORT_SNAPSHOT'
                                    payload: {
                                        node: nodeName,
                                        chunk: llmReportContent, // Send the full content as a chunk
                                        fullReportSnapshot: llmReportContent
                                    },
                                    timestamp: new Date().toISOString(),
                                    sessionId: sessionId,
                                });
                                this.logger.debug(`[DebugStreamService] Queued LLM_CHUNK (full snapshot) from ${nodeName}, length: ${llmReportContent.length}, session: ${sessionId}`);
                            }
                            nodeOutputProcessedForSpecificMessages = true;
                        }
                        // 3. Send a generic NODE_OUTPUT for the entire output of this node,
                        //    IF it wasn't fully captured by the specific handlers above OR if you always want full node outputs.
                        //    This is useful for client-side debugging or complex state updates.
                        //    Let's send it if there's any data at all in nodeOutput.
                        //    The client can then decide how to use/display this.
                        if (nodeOutput && Object.keys(nodeOutput).length > 0) {
                            queue.addMessage({
                                type: 'NODE_OUTPUT',
                                payload: {
                                    node: nodeName,
                                    data: nodeOutput, // Send the full output of the node
                                },
                                timestamp: new Date().toISOString(),
                                sessionId: sessionId,
                            });
                            this.logger.debug(`[DebugStreamService] Queued NODE_OUTPUT for ${nodeName}, session: ${sessionId}`);
                        }
                        else if (!nodeOutputProcessedForSpecificMessages) {
                            // Node had an entry in the chunk but its output was empty/null
                            this.logger.debug(`[DebugStreamService] Node ${nodeName} had null/empty output, session: ${sessionId}`);
                            queue.addMessage({
                                type: 'NODE_SKIPPED_OR_EMPTY', // Or some other informational type
                                payload: {
                                    node: nodeName,
                                    message: 'Node produced no output or was skipped.',
                                },
                                timestamp: new Date().toISOString(),
                                sessionId: sessionId,
                            });
                        }
                    }
                }
            }
            this.logger.log(`[DebugStreamService] Graph stream finished for session ${sessionId}. Accumulated final report length: ${accumulatedFinalReport.length}`);
            if (!accumulatedFinalReport && !queue.isClosed()) {
                this.logger.warn(`[DebugStreamService] No accumulated final report content for session ${sessionId} after stream completion.`);
            }
            return accumulatedFinalReport;
        }
        catch (error) {
            const errorTyped = error;
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
}
exports.DebugStreamService = DebugStreamService;
//# sourceMappingURL=debug-stream-service.js.map