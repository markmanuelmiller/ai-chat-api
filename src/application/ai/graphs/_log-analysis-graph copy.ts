// import { StateGraph, Graph, Annotation } from '@langchain/langgraph';
// import { Runnable } from '@langchain/core/runnables';
// import { GraphState } from './types/state';
// import { BaseChatModel } from '@langchain/core/language_models/chat_models';

// // Import nodes
// import { createDetectIntentNode } from './nodes/detect-intent';
// import { createRequestFiltersNode } from './nodes/request-filters';
// import { createExtractStreamNameNode } from './nodes/extract-stream-name';
// import { createHandleOtherIntentNode } from './nodes/handle-other-intent';
// import { createConfirmToolArgsNode } from './nodes/confirm-tool-args';
// import { createExecuteLogToolNode } from './nodes/execute-log-tool';
// import { createAnalyzeLogsNode } from './nodes/analyze-logs';
// import { createProposeNextStepNode } from './nodes/propose-next-step';
// import { createProcessNextStepChoiceNode } from './nodes/process-next-step-choice';
// import { createHandleToolErrorNode } from './nodes/handle-tool-error';
// interface Intent {
//   type: 'request_filters' | 'extract_stream_name' | 'other';
// }

// const LogState = Annotation.Root({
//   // messages: Array<{ role: string; content: string }>;
//   intent: Annotation<Intent>,
//   streamName: Annotation<string>,
//   message: Annotation<string>,
//   // filterCriteria?: Annotation<object>,
//   // toolArgs?: Annotation<object>,
//   // toolResult?: Annotation<ToolResult>,
//   // logs?: Annotation<string[]>,
//   // nextStep?: Annotation<string>,
//   chatId: Annotation<string>,
// })

// export class LogAnalysisGraph {
//   private graph: StateGraph<typeof LogState>;
//   private llm: BaseChatModel;
  
//   constructor(llm: BaseChatModel) {
//     this.llm = llm;
    
//     // Build the graph
//     this.graph = this.buildGraph();
//   }
  
//   private buildGraph(): StateGraph<typeof LogState> {

//     // const detectIntent = async (input: { message: string }) => {
//     //   const prompt = `Classify the intent of the following user message: "${input.message}".
//     // Respond only with one of the following: "troubleshoot_stream", "other".`;
    
//     //   const result = await this.llm.invoke([{ role: "user", content: prompt }]);
//     //   return result.content;
//     // };
    
//     // // Register nodes
//     // const nodes = {
//     //   intakeMessageNode: async (input: { message: string }) => {
//     //     return { message: input.message };
//     //   },
//     //   detectIntentNode: async (input: { message: string }) => {
//     //     const intent = await detectIntent(input);
//     //     return { message: input.message, intent };
//     //   },
//     // };

//     // Create and wire up the graph

//     // const detectIntent = async (input: { message: string }) => {
//     //   const prompt = `Classify the intent of the following user message: "${input.message}".
//     //     Respond only with one of the following: "troubleshoot_stream", "other".`;
      
//     //   const result = await this.llm.invoke([{ role: "user", content: prompt }]);
//     //   return result.content;
//     // };

//     // const nodes = {
//     //   intakeMessageNode: async (input: { message: string }) => {
//     //     return { message: input.message };
//     //   },
//     //   detectIntentNode: async (input: { message: string }) => {
//     //     const intent = await detectIntent(input);
//     //     return { message: input.message, intent };
//     //   },
      
//     // }

//     // const builder = new StateGraph<GraphState>();

//     // ------------------------

//     // Create graph builder with state schema and proper reducer function
//     // const reducer = <T>(a: T, b: T) => b;
    
//     // const builder = new StateGraph<GraphState>({
//     //   channels: {
//     //     messages: {
//     //       reducer: reducer
//     //     },
//     //     chatId: { 
//     //       reducer: reducer
//     //     },
//     //     intent: { 
//     //       reducer: reducer
//     //     },
//     //     streamName: { 
//     //       reducer: reducer
//     //     },
//     //     filterCriteria: { 
//     //       reducer: reducer
//     //     },
//     //     toolArgs: { 
//     //       reducer: reducer
//     //     },
//     //     toolResult: { 
//     //       reducer: reducer
//     //     },
//     //     logs: { 
//     //       reducer: reducer
//     //     },
//     //     nextStep: { 
//     //       reducer: reducer
//     //     }
//     //   }
//     // });

//     const builder = new StateGraph(LogState);

//     // const intakeMessageNode = async (input: { message: string }) => {
//     const intakeMessageNode = async (state: typeof LogState.State) => {
//       return { message: state.message };
//     };

//     // const detectIntent = async (input: { message: string }) => {
//     const detectIntent = async (state: typeof LogState.State) => {
//       const prompt = `Classify the intent of the following user message: "${state.message}".
//       Respond only with one of the following: "troubleshoot_stream", "other".`;
      
//       const result = await this.llm.invoke([{ role: "user", content: prompt }]);
//       return { intent: result.content };
//     };

//     builder.addNode("intakeMessageNode", intakeMessageNode);
//     builder.addNode("detectIntentNode", detectIntent);

//     builder.addEdge("__start__", "intakeMessageNode");
//     builder.addEdge("intakeMessageNode", "detectIntentNode");
//     builder.compile();

//     return builder;



//     // ------------------------


//     // Create node functions
//     // const detectIntent = createDetectIntentNode(this.llm);
//     // const requestFilters = createRequestFiltersNode(this.llm);
//     // const extractOrRequestStreamName = createExtractStreamNameNode();
//     // const handleOtherIntent = createHandleOtherIntentNode();
//     // const confirmToolArgs = createConfirmToolArgsNode();
//     // const executeLogTool = createExecuteLogToolNode();
//     // const analyzeLogsNode = createAnalyzeLogsNode(this.llm);
//     // const proposeNextStepNode = createProposeNextStepNode(this.llm);
//     // const processNextStepChoiceNode = createProcessNextStepChoiceNode(this.llm);
//     // const handleToolErrorNode = createHandleToolErrorNode();
    
//     // Add nodes to graph
//     // builder.addNode("detect_intent", detectIntent as any);
//     // builder.addNode("request_filters", requestFilters as any);
//     // builder.addNode("extract_or_request_stream_name", extractOrRequestStreamName as any);
//     // builder.addNode("handle_other_intent", handleOtherIntent as any);
//     // builder.addNode("confirm_tool_args", confirmToolArgs as any);
//     // builder.addNode("execute_log_tool", executeLogTool as any);
//     // builder.addNode("analyze_logs", analyzeLogsNode as any);
//     // builder.addNode("propose_next_step", proposeNextStepNode as any);
//     // builder.addNode("process_next_step_choice", processNextStepChoiceNode as any);
//     // builder.addNode("handle_tool_error", handleToolErrorNode as any);
    
//     // Define edges
//     // (a) START --> detect_intent
//     // builder.addEdge("__start__", "detect_intent");
    
//     // // (b) detect_intent conditional edge
//     // builder.addConditionalEdges(
//     //   "detect_intent",
//     //   (state) => {
//     //     const intent = state.intent?.type;
//     //     if (intent === "request_filters") return "request_filters";
//     //     if (intent === "extract_stream_name") return "extract_or_request_stream_name";
//     //     return "handle_other_intent";
//     //   },
//     //   {
//     //     "request_filters": "request_filters",
//     //     "extract_stream_name": "extract_or_request_stream_name",
//     //     "other": "handle_other_intent"
//     //   }
//     // );
    
//     // // (c) extract_or_request_stream_name --> request_filters
//     // builder.addEdge("extract_or_request_stream_name", "request_filters");
    
//     // // (d) request_filters --> confirm_tool_args
//     // builder.addEdge("request_filters", "confirm_tool_args");
    
//     // // (e) confirm_tool_args conditional edge
//     // builder.addConditionalEdges(
//     //   "confirm_tool_args",
//     //   (state) => state.toolArgs ? "execute_log_tool" : "END",
//     //   {
//     //     "execute_log_tool": "execute_log_tool",
//     //     "end": END
//     //   }
//     // );
    
//     // // (f) execute_log_tool conditional edge
//     // builder.addConditionalEdges(
//     //   "execute_log_tool",
//     //   (state) => state.toolResult?.success ? "analyze_logs" : "handle_tool_error",
//     //   {
//     //     "analyze_logs": "analyze_logs",
//     //     "handle_tool_error": "handle_tool_error"
//     //   }
//     // );
    
//     // // (g) analyze_logs --> propose_next_step
//     // builder.addEdge("analyze_logs", "propose_next_step");
    
//     // // (h) propose_next_step --> process_next_step_choice
//     // builder.addEdge("propose_next_step", "process_next_step_choice");
    
//     // // (i) process_next_step_choice conditional edge
//     // builder.addConditionalEdges(
//     //   "process_next_step_choice",
//     //   (state) => state.nextStep === "refine" ? "request_filters" : "END",
//     //   {
//     //     "request_filters": "request_filters",
//     //     "end": END
//     //   }
//     // );
    
//     // // (j) handle_other_intent --> END
//     // builder.addEdge("handle_other_intent", END);
    
//     // // (k) handle_tool_error --> END
//     // builder.addEdge("handle_tool_error", END);
    
//     // Compile the graph
//     // return builder.compile();
//   }
  
//   /**
//    * Runs the graph with the given input state
//    * @param initialState Initial state for the graph
//    * @returns The final state after graph execution
//    */
//   async invoke(initialState: Partial<GraphState>): Promise<GraphState> {
//     return await this.graph.invoke(initialState as GraphState);
//   }
  
//   /**
//    * Streams the graph execution with the given input state
//    * @param initialState Initial state for the graph
//    * @returns A stream of state updates
//    */
//   async stream(initialState: Partial<GraphState>): Promise<AsyncIterable<GraphState>> {
//     return await this.graph.stream(initialState as GraphState);
//   }
// } 