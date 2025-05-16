import { RunnableLambda } from '@langchain/core/runnables';
import { GraphState } from '../types/state';

export function createHandleToolErrorNode() {
  return RunnableLambda.from(async (state: GraphState) => {
    const error = state.toolResult?.error || "Unknown error occurred while processing your request.";
    
    // Create a user-friendly error message
    const errorMessage = `I encountered an issue while retrieving logs: ${error}. Could you try refining your search with different parameters?`;
    
    return {
      messages: [...state.messages, { role: "assistant", content: errorMessage }]
    } as Partial<GraphState>;
  });
} 