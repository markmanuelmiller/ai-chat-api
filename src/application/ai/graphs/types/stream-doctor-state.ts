import { Annotation } from '@langchain/langgraph';

// Tool result interface
export interface ToolResult {
  toolName: string;
  output: string;
}

// Stream Doctor State Annotation
export const StreamDoctorStateAnnotation = Annotation.Root({
  // Input and context
  input: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  chatId: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  streamName: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
  }),
  
  // Tool execution history
  toolsHistory: Annotation<ToolResult[]>({
    reducer: (x, y) => y ?? x ?? [],
  }),
  
  // Results and outputs
  finalResult: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
    default: () => "",
  }),
  error: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
    default: () => "",
  }),
  
  // Conversation tracking
  conversationHistory: Annotation<Array<{role: string, content: string}>>({
    reducer: (x, y) => y ?? x ?? [],
    default: () => [],
  }),
  
  // Session management
  sessionId: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "",
    default: () => "",
  }),
  
  // Streaming messages for real-time updates
  streamingMessages: Annotation<string[]>({
    reducer: (prev: string[], next: string[]) => [...prev, ...next],
    default: () => [],
  }),
});

// Export the state type
export type StreamDoctorState = typeof StreamDoctorStateAnnotation.State;
