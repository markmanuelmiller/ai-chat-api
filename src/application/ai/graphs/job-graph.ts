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
  disk: number;
  network: {
    in: number;
    out: number;
  };
}

export const JobDataAnnotation = Annotation.Root({
  jobId: Annotation<string>,
  launcherStatus: Annotation<string>,
  dbStatus: Annotation<string>,
  jobOrderStatus: Annotation<string>,
  systemResourcesStatus: Annotation<string>,
  report: Annotation<string>,
});

export class JobGraph {
  private graph: any;
  private llm: BaseChatModel;
  private baseUrl: string;
  
  constructor(llm: BaseChatModel, baseUrl: string = 'http://localhost:3001') {
    this.llm = llm;
    this.baseUrl = baseUrl;
    this.graph = this.buildGraph();
  }
  
  private buildGraph(): any {
    const beginNode = async (state: typeof JobDataAnnotation.State) => {
      return {
        jobData: {
          jobId: state.jobId
        }
      };
    }

    const checkLauncherStatusNode = async (state: typeof JobDataAnnotation.State) => {
      const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobId}/launcher-status`);
      return {
        jobData: {
          launcherStatus: response.data.status
        }
      };
    }

    const checkDBStatusNode = async (state: typeof JobDataAnnotation.State) => {
      const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobId}/db-status`);
      return {
        jobData: {
          dbStatus: response.data.status
        }
      };
    }

    const checkJobOrderNode = async (state: typeof JobDataAnnotation.State) => {
      const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobId}/order-status`);
      return {
        jobData: {
          jobOrderStatus: response.data.status
        }
      };
    }

    const checkSystemResourcesNode = async (state: typeof JobDataAnnotation.State) => {
      const response = await axios.get<SystemResourcesResponse>(`${this.baseUrl}/api/system/resources`);
      return {
        jobData: {
          systemResourcesStatus: `memory: ${response.data.memory}%, cpu: ${response.data.cpu}%, disk: ${response.data.disk}%, network in: ${response.data.network.in}%, network out: ${response.data.network.out}%`
        }
      };
    }

    // const debugJobNode = async (state: typeof JobDataAnnotation.State) => {
    //   const msg = await this.llm.invoke(
    //     `Troubleshoot the stream: ${state.jobId} 

    //     Stream Job Status:
    //     - Launcher Status: ${state.jobData.launcherStatus}
    //     - DB Status: ${state.jobData.dbStatus}
    //     - Job Order Status: ${state.jobData.jobOrderStatus}
    //     - System Resources Status: ${state.jobData.systemResourcesStatus}

    //     Can you help troubleshoot the stream?
    //     `
    //   );
    //   console.log("FINAL DEBUG STATE:", state);
    //   console.log("FINAL DEBUG RESPONSE:", msg.content);
    //   return { message: msg.content };
    // }

    const reportNode = async (state: typeof JobDataAnnotation.State) => {
      const report = `
      Job ID: ${state.jobId}
      Launcher Status: ${state.launcherStatus}
      DB Status: ${state.dbStatus}
      Job Order Status: ${state.jobOrderStatus}
      System Resources Status: ${state.systemResourcesStatus}
      `
      return {
        jobData: {
          report: report
        }
      };
    }

    // Build workflow
    const chain = new StateGraph(JobDataAnnotation)
      .addNode("beginNode", beginNode)
      .addNode("checkLauncherStatusNode", checkLauncherStatusNode)
      .addNode("checkDBStatusNode", checkDBStatusNode)
      .addNode("checkJobOrderNode", checkJobOrderNode)
      .addNode("checkSystemResourcesNode", checkSystemResourcesNode)
      .addNode("reportNode", reportNode)
      .addEdge("__start__", "beginNode")
      .addEdge("beginNode", "checkLauncherStatusNode")
      .addEdge("checkLauncherStatusNode", "checkDBStatusNode")
      .addEdge("checkDBStatusNode", "checkJobOrderNode")
      .addEdge("checkJobOrderNode", "checkSystemResourcesNode")
      .addEdge("checkSystemResourcesNode", "reportNode")
      .addEdge("reportNode", "__end__")
      .compile();

    return chain;
  }
  
  /**
   * Runs the graph with the given input state
   * @param initialState Initial state for the graph
   * @returns The final state after graph execution
   */
  // async invoke(initialState: Partial<typeof StateAnnotation.State>): Promise<typeof StateAnnotation.State> {
  //   return await this.graph.invoke(initialState as typeof StateAnnotation.State);
  // }
  
  // /**
  //  * Streams the graph execution with the given input state
  //  * @param initialState Initial state for the graph
  //  * @returns A stream of state updates
  //  */
  // async stream(initialState: Partial<typeof StateAnnotation.State>): Promise<AsyncIterable<typeof StateAnnotation.State>> {
  //   return await this.graph.stream(initialState as typeof StateAnnotation.State);
  // }
}

// export async function createGraph(dependencies: { llm: BaseChatModel, baseUrl: string }) {
//   return new VideoPipelineAssistantGraph(dependencies.llm, dependencies.baseUrl);
// } 