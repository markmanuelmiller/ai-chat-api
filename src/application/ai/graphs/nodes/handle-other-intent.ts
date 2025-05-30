import { RunnableLambda } from '@langchain/core/runnables';
import { GraphState } from '../types/state';

export function createHandleOtherIntentNode() {
  return RunnableLambda.from(async (state: GraphState) => {
    const userMessage = state.messages[state.messages.length - 1].content;
    
    // Generate a helpful response for intents that don't match our primary capabilities
    const response = "I'm a log analysis assistant. I can help you find and analyze logs by filtering them with specific criteria. For example, you can ask me to 'show error logs from the last hour' or 'find transaction logs with status failed'. How can I assist you with log analysis?";
    
    return {
      messages: [...state.messages, { role: "assistant", content: response }]
    } as Partial<GraphState>;
  });
} 