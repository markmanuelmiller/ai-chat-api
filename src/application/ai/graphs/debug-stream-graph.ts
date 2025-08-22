import { StateGraph, Annotation } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import axios from 'axios';
import { JobGraph } from './job-graph';
import { LogGraph } from './log-graph';
import { StreamDoctorGraph } from './stream-doctor-graph';

interface StreamStatusResponse {
  status: string;
  error?: string;
  errorDescription?: string;
}

// Zod schema for intent validation
const IntentSchema = z.object({
  intent: z.enum(['test stream', 'debug stream', 'other']).describe('The detected intent from the user message')
});

const INTENT_PROMPT = `Classify the intent as one of the following: ${IntentSchema.shape.intent._def.values.map(opt => `"${opt}"`).join(', ')}.`;

// Graph state
export const DebugParamsAnnotation = Annotation.Root({
  start: Annotation<string>,
  end: Annotation<string>,
  timezone: Annotation<string>,
  streamType: Annotation<string>,
  streamStatus: Annotation<string>,
  streamError: Annotation<string>,
  streamErrorDescription: Annotation<string>,
});

export const JobDataAnnotation = Annotation.Root({
  jobId: Annotation<string>,
  launcherStatus: Annotation<string>,
  dbStatus: Annotation<string>,
  jobOrderStatus: Annotation<string>,
  systemResourcesStatus: Annotation<string>,
  report: Annotation<string>
});

export const LogDataAnnotation = Annotation.Root({
  logs: Annotation<string[]>,
  errors: Annotation<string[]>,
  warnings: Annotation<string[]>,
  analysis: Annotation<string>
});

export const StateAnnotation = Annotation.Root({
  chatId: Annotation<string>,
  message: Annotation<string>, // user message
  intent: Annotation<string>,
  chatHistory: Annotation<string[]>,
  streamName: Annotation<string>,
  debugParams: Annotation<typeof DebugParamsAnnotation.State>,
  jobData: Annotation<typeof JobDataAnnotation.State>({
    reducer: (prev: typeof JobDataAnnotation.State, next: typeof JobDataAnnotation.State) => ({
      ...prev,
      ...next
    })
  }),
  logData: Annotation<typeof LogDataAnnotation.State>({
    reducer: (prev: typeof LogDataAnnotation.State, next: typeof LogDataAnnotation.State) => ({
      ...prev,
      ...next
    })
  }),
  finalReport: Annotation<string>,
  streamingMessages: Annotation<string[]>({
    reducer: (prev: string[], next: string[]) => [...prev, ...next]
  })
});

export class DebugStreamGraph {
  private graph: any;
  private llm: BaseChatModel;
  private baseUrl: string;
  private jobGraph: JobGraph;
  private logGraph: LogGraph;
  private streamDoctorGraph: StreamDoctorGraph;
  
  constructor(
    llm: BaseChatModel, 
    config: any
  ) {
    this.llm = llm;
    this.baseUrl = config.mockServerUrl;
    this.jobGraph = new JobGraph(llm, config);
    this.logGraph = new LogGraph(llm, config);
    this.streamDoctorGraph = new StreamDoctorGraph(llm);
    this.graph = this.buildGraph();
  }
  
  private buildGraph(): any {
    const intakeMessageNode = async (state: typeof StateAnnotation.State) => {
      // Initialize chat history if it doesn't exist
      if (!state.chatHistory) {
        state.chatHistory = [];
      }
      
      // Add the new message to chat history
      state.chatHistory = [...state.chatHistory, state.message];
      
      return { 
        message: state.message,
        chatHistory: state.chatHistory 
      };
    };
    
    const determineIntentNode = async (state: typeof StateAnnotation.State) => {
      // Include chat history in the prompt for better context
      const chatContext = state.chatHistory.slice(-3).join('\n');
      
      // Use structured output with Zod schema
      const structuredLLM = this.llm.withStructuredOutput(IntentSchema);
      
      const result = await structuredLLM.invoke(
        `Given the following chat history:
        ${chatContext}
        
        Determine the intent of the most recent message: ${state.message}. 
        ${INTENT_PROMPT}`);

      state.intent = result.intent;

      console.log('INTENT', state.intent);
      return state;
    }

    const streamDebugDataCollectorNode = async (state: typeof StateAnnotation.State) => {
      try {
        const response = await axios.get<StreamStatusResponse>(`${this.baseUrl}/api/streams/${state.streamName}/status`);
        return {
          streamStatus: response.data.status,
          streamError: response.data.error ?? '',
          streamErrorDescription: response.data.errorDescription ?? '',
          streamingMessages: [`Fetching status for stream ${state.streamName}...`]
        };
      } catch (error) {
        console.log('Stream status service not available, skipping...');
        return {
          streamStatus: 'unknown',
          streamError: 'Service unavailable',
          streamErrorDescription: 'The stream status service is not available',
          streamingMessages: [`Error: Unable to fetch stream status for ${state.streamName}`]
        };
      }
    }

    const debugStreamRouter = (state: typeof StateAnnotation.State) => {
      if (state.intent.includes("test")) return "Test";
      if (state.intent.includes("debug")) return "Debug";
      return "Fail";
    };

    const streamNameNode = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Extract the stream name from the following message: ${state.message}. Respond only with the stream name.`
      );
      return {
        streamName: msg.content.toString(),
        jobData: {
          jobId: "123"
        }
      };
    }

    const streamDoctorNode = async (state: typeof StateAnnotation.State) => {
      try {
        // Convert the debug stream state to stream doctor state format
        const streamDoctorState = {
          input: state.message,
          chatId: state.chatId,
          streamName: state.streamName,
          conversationHistory: (state.chatHistory || []).map(msg => ({ role: 'user', content: msg })),
          toolsHistory: [],
          sessionId: state.chatId, // Use chatId as sessionId
        };

        console.log('StreamDoctorNode - calling StreamDoctorGraph with state:', streamDoctorState);
        
        // Execute the Stream Doctor Graph
        const result = await this.streamDoctorGraph.invoke(streamDoctorState);
        
        console.log('StreamDoctorNode - StreamDoctorGraph result:', result);
        
        return {
          finalReport: result.finalResult || `Stream Doctor analysis completed for ${state.streamName}`,
          streamingMessages: result.streamingMessages || [`Stream Doctor analysis completed for ${state.streamName}`],
          error: result.error || undefined
        };
      } catch (error) {
        console.error('StreamDoctorNode - Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          finalReport: `Stream Doctor analysis failed for ${state.streamName}: ${errorMessage}`,
          streamingMessages: [`Error during Stream Doctor analysis: ${errorMessage}`],
          error: errorMessage
        };
      }
    }

    const processSubgraphsNode = async (state: typeof StateAnnotation.State) => {
      // Run both subgraphs in parallel
      const [jobResult, logResult] = await Promise.all([
        this.jobGraph.invoke(state),
        this.logGraph.invoke(state)
      ]);

      // Combine the results
      return {
        ...state,
        jobData: jobResult.jobData,
        logData: logResult.logData,
        streamingMessages: [
          'Processing job data...',
          'Analyzing logs...',
          'Combining results...'
        ]
      };
    }

    const generateFinalReportNode = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Generate a final report for the following stream: ${state.streamName}

        Job Status Information:
        ${state.jobData.report}

        Log Analysis:
        ${state.logData.analysis}

        Please provide a comprehensive report that combines both the job status and log analysis.
        Highlight any correlations between job issues and log patterns.
        Provide actionable insights and recommendations.`
      );
      return {
        finalReport: msg.content.toString(),
        streamingMessages: ['Generating final report...']
      };
    }

    // Build workflow
    const chain = new StateGraph(StateAnnotation)
      .addNode("intakeMessageNode", intakeMessageNode)
      .addNode("determineIntentNode", determineIntentNode)
      .addNode("streamNameNode", streamNameNode)
      .addNode("streamDoctorNode", streamDoctorNode)
      .addNode("streamDebugDataCollectorNode", streamDebugDataCollectorNode)
      .addNode("processSubgraphsNode", processSubgraphsNode)
      .addNode("generateFinalReportNode", generateFinalReportNode)
      .addEdge("__start__", "intakeMessageNode")
      .addEdge("intakeMessageNode", "determineIntentNode")
      .addConditionalEdges("determineIntentNode", debugStreamRouter, {
        Test: "streamNameNode",
        Debug: "streamDoctorNode", 
        Fail: "__end__"
      })
      .addEdge("streamNameNode", "streamDebugDataCollectorNode")
      .addEdge("streamDebugDataCollectorNode", "processSubgraphsNode")
      .addEdge("processSubgraphsNode", "generateFinalReportNode")
      .addEdge("generateFinalReportNode", "__end__")
      .addEdge("streamDoctorNode", "__end__")
      .compile();

    return chain;
  }
  
  /**
   * Runs the graph with the given input state
   * @param initialState Initial state for the graph
   * @returns The final state after graph execution
   */
  async invoke(initialState: Partial<typeof StateAnnotation.State>): Promise<typeof StateAnnotation.State> {
    console.log('initialState from invoke', initialState);
    const result = await this.graph.invoke(initialState as typeof StateAnnotation.State);
    console.log('result from graph from invoke', result);
    return result;
  }
  
  /**
   * Streams the graph execution with the given input state
   * @param initialState Initial state for the graph
   * @returns A stream of state updates
   */
  async stream(initialState: Partial<typeof StateAnnotation.State>): Promise<AsyncIterable<typeof StateAnnotation.State>> {
    console.log('initialState from stream', initialState);
    const result = await this.graph.stream(initialState as typeof StateAnnotation.State);
    console.log('result from graph from stream', result);
    return result;
  }
}

export async function createGraph(dependencies: { 
  llm: BaseChatModel,
  baseUrl: string 
}) {
  return new DebugStreamGraph(dependencies.llm, dependencies);
}
