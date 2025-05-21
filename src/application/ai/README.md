# LangGraph Implementation for Stream Debugging

This directory contains a LangGraph implementation for debugging streams using a structured workflow. The implementation follows a graph-based approach where each node in the graph represents a specific step in the debugging process.

## Architecture

The implementation consists of:

1. **Main Graph**: `debug-stream-graph.ts` - Orchestrates the overall debugging flow
2. **Subgraphs**:
   - `job-graph.ts` - Handles job-related status checks
   - `log-graph.ts` - Manages log collection and analysis
3. **Types**: Shared state types are defined in the graph files
4. **Mock Server**: Provides simulated endpoints for testing

## Graph Flow

### Main Graph (DebugStreamGraph)
```
START --> intakeMessageNode --> determineIntentNode -- Conditional --> streamNameNode OR END
streamNameNode --> streamDebugDataCollectorNode --> processSubgraphsNode --> generateFinalReportNode --> END
```

### Job Subgraph (JobGraph)
```
START --> checkLauncherNode --> checkDbNode --> checkJobOrderNode --> checkSystemResourcesNode --> END
```

### Log Subgraph (LogGraph)
```
START --> collectLogsNode --> analyzeLogsNode --> END
```

## Node Descriptions

### Main Graph Nodes
1. **intakeMessageNode**: Processes incoming messages and maintains chat history
2. **determineIntentNode**: Analyzes user intent using LLM
3. **streamNameNode**: Extracts stream name from user message
4. **streamDebugDataCollectorNode**: Collects initial stream status
5. **processSubgraphsNode**: Runs job and log subgraphs in parallel
6. **generateFinalReportNode**: Creates comprehensive debug report

### Job Subgraph Nodes
1. **checkLauncherNode**: Verifies launcher service status
2. **checkDbNode**: Checks database connectivity
3. **checkJobOrderNode**: Validates job order status
4. **checkSystemResourcesNode**: Monitors system resource usage

### Log Subgraph Nodes
1. **collectLogsNode**: Gathers logs from the stream
2. **analyzeLogsNode**: Analyzes logs for patterns and issues

## State Management

The implementation uses a shared state structure with the following main components:

```typescript
StateAnnotation {
  chatId: string
  message: string
  intent: string
  chatHistory: string[]
  streamName: string
  debugParams: DebugParamsAnnotation
  jobData: JobDataAnnotation
  logData: LogDataAnnotation
  finalReport: string
}
```

Each subgraph operates on this shared state, with specific annotations for their respective data:
- `JobDataAnnotation`: Job-related status information
- `LogDataAnnotation`: Log collection and analysis results
- `DebugParamsAnnotation`: Stream debugging parameters

## Usage

The `DebugStreamGraph` provides two main methods:

1. `invoke(initialState: Partial<StateAnnotation.State>): Promise<StateAnnotation.State>`: Processes a debug request and returns the final state
2. `stream(initialState: Partial<StateAnnotation.State>): AsyncIterable<StateAnnotation.State>`: Streams state updates during processing

Example:

```typescript
// Initialize the graph
const graph = new DebugStreamGraph(llm, config);

// Process a debug request
const result = await graph.invoke({
  chatId: 'test-chat',
  message: 'Can you check what\'s wrong with stream test-stream-1?',
  jobData: { /* initial job data */ },
  logData: { /* initial log data */ }
});

// Or stream the updates
for await (const state of graph.stream(initialState)) {
  console.log(state);
}
```

## Integration with Mock Server

The implementation includes a mock server that provides endpoints for:
- Stream status: `/api/streams/:streamName/status`
- Job status: `/api/streams/:streamName/job`
- Log collection: `/api/streams/:streamName/logs`

## Dependencies

This implementation relies on:
- `@langchain/langgraph`: For graph-based workflow
- `@langchain/core`: For basic LangChain functionality
- `axios`: For HTTP requests
- `@langchain/anthropic`: For Claude model integration

## Testing

Integration tests are provided in `tests/integration/debug-stream.test.ts` to verify the complete debugging workflow. 