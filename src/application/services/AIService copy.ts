// import { ChatRepository } from '@/domain/repositories/ChatRepository';
// import { MessageRepository } from '@/domain/repositories/MessageRepository';
// import { Message, MessageRole } from '@/domain/entities/Message';
// import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';
// import { MessageCreatedEvent } from '@/domain/events/impl/MessageCreatedEvent';
// import { logger } from '@/utils/logger';
// import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
// import { ChatPromptTemplate } from '@langchain/core/prompts';
// import { StateGraph, END } from '@langchain/langgraph';
// import { ChatOpenAI } from '@langchain/openai';

// // Define types for our graph state
// interface Intent {
//   type: 'request_filters' | 'extract_stream_name' | 'other';
// }

// interface ToolResult {
//   success: boolean;
//   data?: any;
//   error?: string;
// }

// interface GraphState {
//   messages: Array<{ role: string; content: string }>;
//   intent?: Intent;
//   streamName?: string;
//   filterCriteria?: object;
//   toolArgs?: object;
//   toolResult?: ToolResult;
//   logs?: string[];
//   nextStep?: string;
//   chatId: string;
// }

// export class AIService {
//   private llm: ChatOpenAI;
//   private chatGraph: StateGraph<GraphState>;

//   constructor(
//     private readonly chatRepository: ChatRepository,
//     private readonly messageRepository: MessageRepository,
//     private readonly eventEmitter: DomainEventEmitter,
//   ) {
//     this.llm = new ChatOpenAI({
//       modelName: "gpt-3.5-turbo",
//       temperature: 0,
//     });
    
//     this.initializeGraph();
//   }

//   private initializeGraph() {
//     // Create the graph
//     const builder = new StateGraph<GraphState>({ channels: { messages: { value: [] } } });
    
//     // Define node functions
//     const detectIntent = this.defineDetectIntentNode();
//     const requestFilters = this.defineRequestFiltersNode();
//     const extractOrRequestStreamName = this.defineExtractOrRequestStreamNameNode();
//     const handleOtherIntent = this.defineHandleOtherIntentNode();
//     const confirmToolArgs = this.defineConfirmToolArgsNode();
//     const executeLogTool = this.defineExecuteLogToolNode();
//     const analyzeLogsNode = this.defineAnalyzeLogsNode();
//     const proposeNextStepNode = this.defineProposeNextStepNode();
//     const processNextStepChoiceNode = this.defineProcessNextStepChoiceNode();
//     const handleToolErrorNode = this.defineHandleToolErrorNode();
    
//     // Add nodes to graph
//     builder.addNode("detect_intent", detectIntent);
//     builder.addNode("request_filters", requestFilters);
//     builder.addNode("extract_or_request_stream_name", extractOrRequestStreamName);
//     builder.addNode("handle_other_intent", handleOtherIntent);
//     builder.addNode("confirm_tool_args", confirmToolArgs);
//     builder.addNode("execute_log_tool", executeLogTool);
//     builder.addNode("analyze_logs", analyzeLogsNode);
//     builder.addNode("propose_next_step", proposeNextStepNode);
//     builder.addNode("process_next_step_choice", processNextStepChoiceNode);
//     builder.addNode("handle_tool_error", handleToolErrorNode);
    
//     // Define edges
//     builder.addEdge("START", "detect_intent");
    
//     // (b) detect_intent conditional edge
//     builder.addConditionalEdges(
//       "detect_intent",
//       (state) => {
//         const intent = state.intent?.type;
//         if (intent === "request_filters") return "request_filters";
//         if (intent === "extract_stream_name") return "extract_or_request_stream_name";
//         return "handle_other_intent";
//       },
//       {
//         "request_filters": "request_filters",
//         "extract_stream_name": "extract_or_request_stream_name",
//         "other": "handle_other_intent"
//       }
//     );
    
//     // (c) extract_or_request_stream_name --> request_filters
//     builder.addEdge("extract_or_request_stream_name", "request_filters");
    
//     // (d) request_filters --> confirm_tool_args
//     builder.addEdge("request_filters", "confirm_tool_args");
    
//     // (e) confirm_tool_args conditional edge
//     builder.addConditionalEdges(
//       "confirm_tool_args",
//       (state) => state.toolArgs ? "execute_log_tool" : "END",
//       {
//         "execute_log_tool": "execute_log_tool",
//         "end": END
//       }
//     );
    
//     // (f) execute_log_tool conditional edge
//     builder.addConditionalEdges(
//       "execute_log_tool",
//       (state) => state.toolResult?.success ? "analyze_logs" : "handle_tool_error",
//       {
//         "analyze_logs": "analyze_logs",
//         "handle_tool_error": "handle_tool_error"
//       }
//     );
    
//     // (g) analyze_logs --> propose_next_step
//     builder.addEdge("analyze_logs", "propose_next_step");
    
//     // (h) propose_next_step --> process_next_step_choice
//     builder.addEdge("propose_next_step", "process_next_step_choice");
    
//     // (i) process_next_step_choice conditional edge
//     builder.addConditionalEdges(
//       "process_next_step_choice",
//       (state) => state.nextStep === "refine" ? "request_filters" : "END",
//       {
//         "request_filters": "request_filters",
//         "end": END
//       }
//     );
    
//     // (j) handle_other_intent --> END
//     builder.addEdge("handle_other_intent", END);
    
//     // (k) handle_tool_error --> END
//     builder.addEdge("handle_tool_error", END);
    
//     // Compile the graph
//     this.chatGraph = builder.compile();
//   }
  
//   private defineDetectIntentNode() {
//     const promptTemplate = ChatPromptTemplate.fromMessages([
//       ["system", "Analyze the user's message and determine their intent."],
//       ["human", "{userMessage}"]
//     ]);
    
//     return RunnableSequence.from([
//       RunnableLambda.from((state: GraphState) => {
//         const userMessage = state.messages[state.messages.length - 1].content;
//         return { userMessage };
//       }),
//       promptTemplate,
//       this.llm,
//       RunnableLambda.from(async (output) => {
//         const content = output.content;
//         let intent: Intent = { type: 'other' };
        
//         if (content.toLowerCase().includes('filter') || content.toLowerCase().includes('search')) {
//           intent = { type: 'request_filters' };
//         } else if (content.toLowerCase().includes('stream') || content.toLowerCase().includes('log')) {
//           intent = { type: 'extract_stream_name' };
//         }
        
//         return { intent };
//       })
//     ]);
//   }
  
//   private defineRequestFiltersNode() {
//     const promptTemplate = ChatPromptTemplate.fromMessages([
//       ["system", "Extract filter criteria from the user's message."],
//       ["human", "{userMessage}"]
//     ]);
    
//     return RunnableSequence.from([
//       RunnableLambda.from((state: GraphState) => {
//         const userMessage = state.messages[state.messages.length - 1].content;
//         return { userMessage };
//       }),
//       promptTemplate,
//       this.llm,
//       RunnableLambda.from(async (output) => {
//         // Parse filter criteria from LLM output
//         const filterCriteria = { /* extract from output.content */ };
//         return { filterCriteria };
//       })
//     ]);
//   }
  
//   private defineExtractOrRequestStreamNameNode() {
//     return RunnableLambda.from(async (state: GraphState) => {
//       const userMessage = state.messages[state.messages.length - 1].content;
//       // Extract stream name logic
//       const streamName = "default-stream"; // This would be extracted from the message
//       return { streamName };
//     });
//   }
  
//   private defineHandleOtherIntentNode() {
//     return RunnableLambda.from(async (state: GraphState) => {
//       const response = "I'm not sure how to help with that request. Could you try asking about logs or filters?";
//       return {
//         messages: [...state.messages, { role: "assistant", content: response }]
//       };
//     });
//   }
  
//   private defineConfirmToolArgsNode() {
//     return RunnableLambda.from(async (state: GraphState) => {
//       // Combine stream name and filter criteria into tool args
//       const toolArgs = {
//         streamName: state.streamName,
//         filters: state.filterCriteria
//       };
      
//       return { toolArgs };
//     });
//   }
  
//   private defineExecuteLogToolNode() {
//     return RunnableLambda.from(async (state: GraphState) => {
//       try {
//         // Mock executing a log tool
//         logger.info("Executing log tool with args:", state.toolArgs);
//         const logs = ["Log entry 1", "Log entry 2", "Log entry 3"];
        
//         return {
//           toolResult: {
//             success: true,
//             data: logs
//           },
//           logs
//         };
//       } catch (error) {
//         return {
//           toolResult: {
//             success: false,
//             error: error instanceof Error ? error.message : String(error)
//           }
//         };
//       }
//     });
//   }
  
//   private defineAnalyzeLogsNode() {
//     const promptTemplate = ChatPromptTemplate.fromMessages([
//       ["system", "Analyze these logs and provide insights."],
//       ["human", "Logs: {logs}"]
//     ]);
    
//     return RunnableSequence.from([
//       RunnableLambda.from((state: GraphState) => ({ logs: state.logs?.join("\n") })),
//       promptTemplate,
//       this.llm,
//       RunnableLambda.from(async (output) => {
//         const analysis = output.content;
//         return {
//           messages: [...state.messages, { role: "assistant", content: analysis }]
//         };
//       })
//     ]);
//   }
  
//   private defineProposeNextStepNode() {
//     const promptTemplate = ChatPromptTemplate.fromMessages([
//       ["system", "Based on the log analysis, suggest the next step."],
//       ["human", "Analysis: {analysis}"]
//     ]);
    
//     return RunnableSequence.from([
//       RunnableLambda.from((state: GraphState) => {
//         const analysis = state.messages[state.messages.length - 1].content;
//         return { analysis };
//       }),
//       promptTemplate,
//       this.llm,
//       RunnableLambda.from(async (output) => {
//         return {
//           messages: [...state.messages, { role: "assistant", content: output.content }]
//         };
//       })
//     ]);
//   }
  
//   private defineProcessNextStepChoiceNode() {
//     return RunnableLambda.from(async (state: GraphState) => {
//       // This would normally parse the user's choice from their response
//       // For now, we'll just assume they want to refine or end
//       const lastMessage = state.messages[state.messages.length - 1].content.toLowerCase();
//       const nextStep = lastMessage.includes("refine") ? "refine" : "end";
      
//       return { nextStep };
//     });
//   }
  
//   private defineHandleToolErrorNode() {
//     return RunnableLambda.from(async (state: GraphState) => {
//       const errorMessage = `There was an error executing the tool: ${state.toolResult?.error}`;
//       return {
//         messages: [...state.messages, { role: "assistant", content: errorMessage }]
//       };
//     });
//   }

//   // Updated version of generateResponse using the LangGraph
//   async generateResponse(chatId: string, userMessage: string): Promise<Message> {
//     const chat = await this.chatRepository.findById(chatId);
//     if (!chat) {
//       throw new Error('Chat not found');
//     }

//     // Save the user message
//     const userMessageEntity = Message.create({
//       chatId,
//       role: MessageRole.USER,
//       content: userMessage,
//     });
//     await this.messageRepository.save(userMessageEntity);
//     await this.eventEmitter.emit(
//       new MessageCreatedEvent(
//         userMessageEntity.id,
//         chatId,
//         MessageRole.USER,
//         userMessageEntity.content,
//       ),
//     );

//     // Initial state for the graph
//     const initialState: GraphState = {
//       messages: [{ role: "human", content: userMessage }],
//       chatId
//     };

//     // Execute the graph
//     const result = await this.chatGraph.invoke(initialState);
    
//     // Get the assistant's response from the final state
//     const assistantMessages = result.messages.filter(m => m.role === "assistant");
//     const assistantResponse = assistantMessages.length > 0 
//       ? assistantMessages[assistantMessages.length - 1].content 
//       : "I couldn't process your request.";

//     // Save the assistant message
//     const assistantMessage = Message.create({
//       chatId,
//       role: MessageRole.ASSISTANT,
//       content: assistantResponse,
//     });
//     const savedMessage = await this.messageRepository.save(assistantMessage);
//     await this.eventEmitter.emit(
//       new MessageCreatedEvent(savedMessage.id, chatId, MessageRole.ASSISTANT, savedMessage.content),
//     );

//     return savedMessage;
//   }

//   // Updated version of streamResponse using the LangGraph
//   async streamResponse(chatId: string, userMessage: string): Promise<AsyncGenerator<string, void, unknown>> {
//     const chat = await this.chatRepository.findById(chatId);
//     if (!chat) {
//       throw new Error('Chat not found');
//     }

//     // Save the user message
//     const userMessageEntity = Message.create({
//       chatId,
//       role: MessageRole.USER,
//       content: userMessage,
//     });
//     await this.messageRepository.save(userMessageEntity);
//     await this.eventEmitter.emit(
//       new MessageCreatedEvent(
//         userMessageEntity.id,
//         chatId,
//         MessageRole.USER,
//         userMessageEntity.content,
//       ),
//     );

//     // Store references to instance properties needed in the generator
//     const messageRepository = this.messageRepository;
//     const eventEmitter = this.eventEmitter;
//     const chatGraph = this.chatGraph;

//     // Initial state for the graph
//     const initialState: GraphState = {
//       messages: [{ role: "human", content: userMessage }],
//       chatId
//     };

//     async function* streamGraph() {
//       try {
//         // Stream the graph execution
//         const stream = await chatGraph.stream(initialState);
//         let fullResponse = '';
        
//         for await (const chunk of stream) {
//           // Only yield assistant messages to the client
//           if (chunk.messages) {
//             const assistantMessages = chunk.messages.filter(m => m.role === "assistant");
//             if (assistantMessages.length > 0) {
//               const latestMessage = assistantMessages[assistantMessages.length - 1].content;
//               // Only stream the new part
//               if (latestMessage.length > fullResponse.length) {
//                 const newContent = latestMessage.substring(fullResponse.length);
//                 fullResponse = latestMessage;
//                 yield newContent;
//               }
//             }
//           }
//         }
        
//         // Save the complete response at the end
//         if (fullResponse) {
//           const assistantMessage = Message.create({
//             chatId,
//             role: MessageRole.ASSISTANT,
//             content: fullResponse.trim(),
//           });
//           await messageRepository.save(assistantMessage);
//           await eventEmitter.emit(
//             new MessageCreatedEvent(
//               assistantMessage.id,
//               chatId,
//               MessageRole.ASSISTANT,
//               assistantMessage.content,
//             ),
//           );
//         }
//       } catch (error) {
//         logger.error('Error streaming response:', error);
//         yield "Sorry, I encountered an error processing your request.";
//       }
//     }

//     return streamGraph();
//   }
// }
