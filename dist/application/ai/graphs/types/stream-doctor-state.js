"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamDoctorStateAnnotation = void 0;
const langgraph_1 = require("@langchain/langgraph");
// Stream Doctor State Annotation
exports.StreamDoctorStateAnnotation = langgraph_1.Annotation.Root({
    // Input and context
    input: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? "",
    }),
    chatId: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? "",
    }),
    streamName: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? "",
    }),
    // Tool execution history
    toolsHistory: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? [],
    }),
    // Results and outputs
    finalResult: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? "",
        default: () => "",
    }),
    error: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? "",
        default: () => "",
    }),
    // Conversation tracking
    conversationHistory: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? [],
        default: () => [],
    }),
    // Session management
    sessionId: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x ?? "",
        default: () => "",
    }),
    // Streaming messages for real-time updates
    streamingMessages: (0, langgraph_1.Annotation)({
        reducer: (prev, next) => [...prev, ...next],
        default: () => [],
    }),
});
//# sourceMappingURL=stream-doctor-state.js.map