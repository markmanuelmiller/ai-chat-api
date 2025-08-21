export interface ToolResult {
    toolName: string;
    output: string;
}
export declare const StreamDoctorStateAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    input: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    chatId: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    streamName: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    toolsHistory: import("@langchain/langgraph").BinaryOperatorAggregate<ToolResult[], ToolResult[]>;
    finalResult: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    error: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    conversationHistory: import("@langchain/langgraph").BinaryOperatorAggregate<{
        role: string;
        content: string;
    }[], {
        role: string;
        content: string;
    }[]>;
    sessionId: import("@langchain/langgraph").BinaryOperatorAggregate<string, string>;
    streamingMessages: import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
}>;
export type StreamDoctorState = typeof StreamDoctorStateAnnotation.State;
