# LangGraph Implementation for Log Analysis

This directory contains a LangGraph implementation for analyzing logs using a structured workflow. The implementation follows a graph-based approach where each node in the graph represents a specific step in the log analysis process.

## Architecture

The implementation consists of:

1. **Graph Structure**: Defined in `graph/log-analysis-graph.ts`
2. **Node Implementations**: Each step in the workflow is implemented as a separate node in the `graph/nodes/` directory
3. **Types**: Shared types are defined in `graph/types/`
4. **Integration Service**: The `log-analysis-service.ts` provides a clean API for interacting with the graph

## Graph Flow

The graph has the following nodes and edges:

```
(a) START --> detect_intent (Entry Point)   
(b) detect_intent -- Conditional --> request_filters OR extract_or_request_stream_name OR handle_other_intent (Conditional Edge)   
(c) extract_or_request_stream_name --> request_filters (Normal Edge)   
(d) request_filters --> confirm_tool_args (Normal Edge)
(e) confirm_tool_args -- Conditional --> execute_log_tool OR END (Conditional Edge)
(f) execute_log_tool -- Conditional --> analyze_logs OR handle_tool_error (Conditional Edge, including error path)   
(g) analyze_logs --> propose_next_step (Normal Edge)
(h) propose_next_step --> process_next_step_choice (Normal Edge)
(i) process_next_step_choice -- Conditional --> request_filters OR END (Conditional Edge, creating a potential loop)   
(j) handle_other_intent --> END (Normal Edge)
(k) handle_tool_error --> END (Normal Edge)
```

## Node Descriptions

1. **detect_intent**: Analyzes the user message to determine their intent
2. **request_filters**: Extracts filter criteria for log searches
3. **extract_or_request_stream_name**: Extracts the stream name from the user message
4. **handle_other_intent**: Handles intents that don't relate to log analysis
5. **confirm_tool_args**: Confirms and prepares arguments for the log search tool
6. **execute_log_tool**: Executes log retrieval (currently mocked)
7. **analyze_logs**: Analyzes the retrieved logs
8. **propose_next_step**: Suggests next steps based on the analysis
9. **process_next_step_choice**: Processes the user's choice for the next step
10. **handle_tool_error**: Handles any errors in log tool execution

## Usage

The `LogAnalysisService` provides two main methods:

1. `processMessage(chatId: string, userMessage: string): Promise<string>`: Processes a user message and returns a response
2. `streamResponse(chatId: string, userMessage: string): AsyncGenerator<string, void, unknown>`: Streams the response

Example:

```typescript
// Initialize the service
const logAnalysisService = new LogAnalysisService();

// Process a message
const response = await logAnalysisService.processMessage("chat123", "Show me error logs from the last hour");

// Or stream the response
for await (const chunk of logAnalysisService.streamResponse("chat123", "Show me error logs from the last hour")) {
  console.log(chunk);
}
```

## Integration with AIService

The `LogAnalysisService` is integrated with the main `AIService` in the application. The `AIService` uses the `LogAnalysisService` for both the regular and streaming response methods.

## Customization

To customize the implementation:

1. Modify the node implementations in `graph/nodes/` to change the behavior of specific steps
2. Adjust the graph structure in `log-analysis-graph.ts` to change the flow
3. Update the state types in `graph/types/state.ts` if additional state properties are needed

## Dependencies

This implementation relies on the following dependencies:

- `@langchain/core`: For basic LangChain functionality
- `@langchain/langgraph`: For the graph-based workflow
- `@langchain/openai`: For OpenAI model integration

Make sure these are installed in your project. 