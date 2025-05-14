import { StateGraph, Annotation } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import axios from 'axios';

interface StreamStatusResponse {
  status: string;
  error?: string;
  errorDescription?: string;
}

interface JobStatusResponse {
  status: string;
}

interface SystemResourcesResponse {
  cpu: number;
  memory: number;
}

// Graph state
export const DebugParamsAnnotation = Annotation.Root({
  start: Annotation<string>,
  end: Annotation<string>,
  streamName: Annotation<string>,
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
});

export const StateAnnotation = Annotation.Root({
  chatId: Annotation<string>,
  message: Annotation<string>,
  intent: Annotation<string>,
  streamName: Annotation<string>,
  debugParams: Annotation<typeof DebugParamsAnnotation.State>,
  jobData: Annotation<typeof JobDataAnnotation.State>({
    reducer: (prev: typeof JobDataAnnotation.State, next: typeof JobDataAnnotation.State) => ({
      ...prev,
      ...next
    })
  })
});

const routes = {
  "troubleshoot_stream": {
    "streamNameNode": {
      "troubleshootStreamNode": {
        "__end__": {}
      }
    }
  }
}

export class VideoPipelineAssistantGraph {
  private graph: any;
  private llm: BaseChatModel;
  private baseUrl: string;
  
  constructor(llm: BaseChatModel, baseUrl: string = 'http://localhost:3001') {
    this.llm = llm;
    this.baseUrl = baseUrl;
    this.graph = this.buildGraph();
  }
  
  private buildGraph(): any {
    const intakeMessageNode = async (state: typeof StateAnnotation.State) => {
      return { message: state.message };
    };
    
    const determineIntentNode = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Determine the intent of the following message: ${state.message}. 
        Respond only with one of the following: "troubleshoot_stream", "other".`);
      console.log("msg", msg);

      state.intent = msg.content.toString();
      return state;
    }

    const streamDebugDataCollectorNode = async (state: typeof StateAnnotation.State) => {
      const response = await axios.get<StreamStatusResponse>(`${this.baseUrl}/api/streams/${state.streamName}/status`);
      return {
        streamStatus: response.data.status,
        streamError: response.data.error ?? '',
        streamErrorDescription: response.data.errorDescription ?? ''
      };
    }

    const router = (state: typeof StateAnnotation.State) => 
      state.intent === "troubleshoot_stream" ? "Pass" : "Fail";

    const streamNameNode = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Extract the stream name from the following message: ${state.message}. Respond only with the stream name.`
      );
      // state.streamName = msg.content.toString();
      // state.jobData.jobId = "123";
      return {
        streamName: msg.content.toString(),
        jobData: {
          ...state.jobData,
          jobId: "123"
        }
      };
    }

    const checkLauncherStatusNode = async (state: typeof StateAnnotation.State) => {
      const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/launcher-status`);
      console.log("LAUNCHER STATUS RESPONSE:", response.data);
      return {
        jobData: {
          ...state.jobData,
          launcherStatus: response.data.status
        }
      };
    }

    const checkDBStatusNode = async (state: typeof StateAnnotation.State) => {
      const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/db-status`);
      console.log("DB STATUS RESPONSE:", response.data);
      return {
        jobData: {
          ...state.jobData,
          dbStatus: response.data.status
        }
      };
    }

    const checkJobOrderNode = async (state: typeof StateAnnotation.State) => {
      const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/order-status`);
      console.log("JOB ORDER STATUS RESPONSE:", response.data);
      return {
        jobData: {
          ...state.jobData,
          jobOrderStatus: response.data.status
        }
      };
    }

    const checkSystemResourcesNode = async (state: typeof StateAnnotation.State) => {
      const response = await axios.get<SystemResourcesResponse>(`${this.baseUrl}/api/system/resources`);
      console.log("SYSTEM RESOURCES RESPONSE:", response.data);
      return {
        jobData: {
          ...state.jobData,
          systemResourcesStatus: `memory: ${response.data.memory}, cpu: ${response.data.cpu}`
        }
      };
    }

    const joinNode = async (state: typeof StateAnnotation.State) => {
      // Just pass through the state since parallel nodes are already handling their updates
      return state;
    }

    const debugJobNode = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Troubleshoot the stream: ${state.streamName} with the following statuses:

        Launcher Status: ${state.jobData.launcherStatus}
        DB Status: ${state.jobData.dbStatus}
        Job Order Status: ${state.jobData.jobOrderStatus}
        System Resources Status: ${state.jobData.systemResourcesStatus}

        can you figure out what is wrong with the stream?
        `
      );
      console.log("FINAL DEBUG STATE:", state);
      console.log("FINAL DEBUG RESPONSE:", msg.content);
      return { message: msg.content };
    }

    // Build workflow
    const chain = new StateGraph(StateAnnotation)
      .addNode("intakeMessageNode", intakeMessageNode)
      .addNode("determineIntentNode", determineIntentNode)
      .addNode("streamNameNode", streamNameNode)
      .addNode("streamDebugDataCollectorNode", streamDebugDataCollectorNode)
      .addNode("checkLauncherStatusNode", checkLauncherStatusNode)
      .addNode("checkDBStatusNode", checkDBStatusNode)
      .addNode("checkJobOrderNode", checkJobOrderNode)
      .addNode("checkSystemResourcesNode", checkSystemResourcesNode)
      .addNode("joinNode", joinNode)
      .addNode("debugJobNode", debugJobNode)
      .addEdge("__start__", "intakeMessageNode")
      .addEdge("intakeMessageNode", "determineIntentNode")
      .addConditionalEdges("determineIntentNode", router, {
        Pass: "streamNameNode",
        Fail: "__end__"
      })
      .addEdge("streamNameNode", "streamDebugDataCollectorNode")
      .addEdge("streamNameNode", "checkLauncherStatusNode")
      .addEdge("streamNameNode", "checkDBStatusNode")
      .addEdge("streamNameNode", "checkJobOrderNode")
      .addEdge("streamNameNode", "checkSystemResourcesNode")
      .addEdge("streamDebugDataCollectorNode", "joinNode")
      .addEdge("checkLauncherStatusNode", "joinNode")
      .addEdge("checkDBStatusNode", "joinNode")
      .addEdge("checkJobOrderNode", "joinNode")
      .addEdge("checkSystemResourcesNode", "joinNode")
      .addEdge("joinNode", "debugJobNode")
      .addEdge("debugJobNode", "__end__")
      .compile();

    return chain;
  }
  
  /**
   * Runs the graph with the given input state
   * @param initialState Initial state for the graph
   * @returns The final state after graph execution
   */
  async invoke(initialState: Partial<typeof StateAnnotation.State>): Promise<typeof StateAnnotation.State> {
    return await this.graph.invoke(initialState as typeof StateAnnotation.State);
  }
  
  /**
   * Streams the graph execution with the given input state
   * @param initialState Initial state for the graph
   * @returns A stream of state updates
   */
  async stream(initialState: Partial<typeof StateAnnotation.State>): Promise<AsyncIterable<typeof StateAnnotation.State>> {
    return await this.graph.stream(initialState as typeof StateAnnotation.State);
  }
} 