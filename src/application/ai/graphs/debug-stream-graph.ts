import { StateGraph, Annotation } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { RunnableConfig } from '@langchain/core/runnables';
import axios from 'axios';
import { JobGraph } from './job-graph';
import { LogGraph } from './log-graph';

interface StreamStatusResponse {
  status: string;
  error?: string;
  errorDescription?: string;
}

// Graph state
export const DebugParamsAnnotation = Annotation.Root({
  start: Annotation<string>, // stream start time
  end: Annotation<string>, // stream end time
  timezone: Annotation<string>, // end user timezone
  streamType: Annotation<string>, // rtmp, webrtc
  streamStatus: Annotation<string>, // running, paused, ended, failed
  // streamError: Annotation<string>,
  // streamErrorDescription: Annotation<string>,
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
  }),
  humanConfirmation: Annotation<boolean | null>,
  isResuming: Annotation<boolean | null>
});

export class DebugStreamGraph {
  private graph: any;
  private llm: BaseChatModel;
  private baseUrl: string;
  private jobGraph: JobGraph;
  private logGraph: LogGraph;
  
  constructor(
    llm: BaseChatModel, 
    config: any
  ) {
    this.llm = llm;
    this.baseUrl = config.mockServerUrl;
    this.jobGraph = new JobGraph(llm, config);
    this.logGraph = new LogGraph(llm, config);
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
      console.time('determineIntentLLM llmtime');
      const msg = await this.llm.invoke(
        `Given the following chat history:
        ${chatContext}
        
        Determine the intent of the most recent message: ${state.message}. 
        Respond only with one of the following: "debug_stream", "other".`);
      console.timeEnd('determineIntentLLM llmtime');

      state.intent = msg.content.toString();
      return state;
    }

    const streamDebugDataCollectorNode = async (state: typeof StateAnnotation.State) => {
      let newHumanConfirmation: boolean | null = null;

      if (state.isResuming && state.humanConfirmation === true) {
        // If resuming and user had approved, keep confirmation as true to proceed.
        newHumanConfirmation = true;
      } else {
        // For initial run, or if resuming but user rejected (humanConfirmation would be false),
        // or if isResuming is not set, set to null to trigger pause (or allow "End" if HC was false).
        newHumanConfirmation = null;
      }

      try {
        const response = await axios.get<StreamStatusResponse>(`${this.baseUrl}/api/streams/${state.streamName}/status`);
        return {
          debugParams: {
            ...state.debugParams,
            streamStatus: response.data.status,
            streamError: response.data.error ?? '',
            streamErrorDescription: response.data.errorDescription ?? '',
          },
          streamingMessages: [`Fetching status for stream ${state.streamName}...`],
          humanConfirmation: newHumanConfirmation,
          isResuming: false,
        };
      } catch (error) {
        console.log('Stream status service not available, skipping...');
        return {
          debugParams: {
            ...state.debugParams,
            streamStatus: 'unknown',
            streamError: 'Service unavailable',
            streamErrorDescription: 'The stream status service is not available',
          },
          streamingMessages: [`Error: Unable to fetch stream status for ${state.streamName}`],
          humanConfirmation: newHumanConfirmation,
          isResuming: false,
        };
      }
    }

    const humanInputRouterNode = (state: typeof StateAnnotation.State) => {
      // This router now correctly sees humanConfirmation as true if resumed with approval
      return state.humanConfirmation === true ? "Continue" : "End";
    }

    const debugStreamRouter = (state: typeof StateAnnotation.State) => 
      state.intent === "debug_stream" ? "Pass" : "Fail";

    const streamNameNode = async (state: typeof StateAnnotation.State) => {
      console.time('streamNameLLM llmtime');
      const msg = await this.llm.invoke(
        `Extract the stream name from the following message: ${state.message}. Respond only with the stream name.`
      );
      console.timeEnd('streamNameLLM llmtime');
      return {
        streamName: msg.content.toString(),
        jobData: {
          jobId: "123"
        }
      };
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
        ]
      };
    }

    
    const generateFinalReportNode = async (state: typeof StateAnnotation.State) => {
      console.time('generateFinalReportLLM llmtime');
      const msg = await this.llm.invoke(
        `Generate a final report for the following stream: ${state.streamName}

        Job Status Report:
        ${state.jobData.report}

        Log Analysis Report:
        ${state.logData.analysis}

        Please provide a concise final report that combines both the job status and log analysis.
        Highlight any correlations between job issues and log patterns.
        Provide actionable insights and recommendations.
        Use simple markdown formatting with bold, italic, and bullet points.
        You can include status emojis to make the report more engaging.`
      );
      console.timeEnd('generateFinalReportLLM llmtime');
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
      .addNode("streamDebugDataCollectorNode", streamDebugDataCollectorNode)
      .addNode("processSubgraphsNode", processSubgraphsNode)
      .addNode("generateFinalReportNode", generateFinalReportNode)
      .addEdge("__start__", "intakeMessageNode")
      .addEdge("intakeMessageNode", "determineIntentNode")
      .addConditionalEdges("determineIntentNode", debugStreamRouter, {
        Pass: "streamNameNode",
        Fail: "__end__"
      })
      .addEdge("streamNameNode", "streamDebugDataCollectorNode")
      .addConditionalEdges("streamDebugDataCollectorNode", humanInputRouterNode, {
        Continue: "processSubgraphsNode",
        End: "__end__"
      })
      .addEdge("processSubgraphsNode", "generateFinalReportNode")
      .addEdge("generateFinalReportNode", "__end__")
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
   * @param config Optional config for the graph
   * @returns A stream of state updates
   */
  async stream(
    initialState: Partial<typeof StateAnnotation.State>,
    config?: RunnableConfig
  ): Promise<AsyncIterable<typeof StateAnnotation.State>> {
    console.log('initialState from stream', initialState);
    console.log('config for stream', config);
    const result = await this.graph.stream(initialState as typeof StateAnnotation.State, config);
    return result;
  }
}

export async function createGraph(dependencies: { 
  llm: BaseChatModel,
  baseUrl: string 
}) {
  return new DebugStreamGraph(dependencies.llm, dependencies);
} 