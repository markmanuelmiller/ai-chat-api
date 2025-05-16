import { RunnableLambda } from '@langchain/core/runnables';
import { GraphState } from '../types/state';

export function createExtractStreamNameNode() {
  return RunnableLambda.from(async (state: GraphState) => {
    const userMessage = state.messages[state.messages.length - 1].content.toLowerCase();
    
    // Extract stream name logic
    let streamName = "default-stream";
    
    // Look for common patterns that might indicate a stream name
    const streamPatterns = [
      /stream\s+["']?([a-zA-Z0-9_-]+)["']?/i,     // "stream xyz"
      /logs?\s+(?:from|of)\s+["']?([a-zA-Z0-9_-]+)["']?/i,  // "logs from xyz"
      /["']([a-zA-Z0-9_-]+)["']\s+(?:stream|logs?)/i,  // "xyz logs"
      /check\s+["']?([a-zA-Z0-9_-]+)["']?/i       // "check xyz"
    ];
    
    // Try to find a match
    for (const pattern of streamPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        streamName = match[1];
        break;
      }
    }
    
    // List of predefined streams to check against
    const knownStreams = ["application", "system", "error", "access", "transaction"];
    
    // Check for any known stream names in the message
    for (const stream of knownStreams) {
      if (userMessage.includes(stream)) {
        streamName = stream;
        break;
      }
    }
    
    return { streamName } as Partial<GraphState>;
  });
} 