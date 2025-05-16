import { RunnableLambda } from '@langchain/core/runnables';
import { GraphState } from '../types/state';

export function createConfirmToolArgsNode() {
  return RunnableLambda.from(async (state: GraphState) => {
    // Combine stream name and filter criteria into tool args
    const streamName = state.streamName || "default-stream";
    const filterCriteria = state.filterCriteria || {};
    
    // Create a message to confirm what we're about to do
    const confirmationMessage = `I'll search for logs in the "${streamName}" stream with the following filters: ${JSON.stringify(filterCriteria, null, 2)}`;
    
    const toolArgs = {
      streamName,
      filters: filterCriteria,
      // Add any additional args needed for tool execution
      limit: 100, // Default limit
      format: "json" // Default format
    };
    
    return {
      toolArgs,
      messages: [...state.messages, { role: "assistant", content: confirmationMessage }]
    } as Partial<GraphState>;
  });
} 