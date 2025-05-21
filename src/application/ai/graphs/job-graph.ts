import { StateGraph, Annotation } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import axios from 'axios';
import { StateAnnotation, JobDataAnnotation } from './debug-stream-graph';

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

export class JobGraph {
  private graph: any;
  private llm: BaseChatModel;
  private baseUrl: string;
  
  constructor(
    llm: BaseChatModel, 
    config: any
  ) {
    this.llm = llm;
    this.baseUrl = config.mockServerUrl;
    this.graph = this.buildGraph();
  }
  
  private buildGraph(): any {
    const beginNode = async (state: typeof StateAnnotation.State) => {
      console.log("BASE URL:", this.baseUrl);
      return state;
    }

    const checkLauncherStatusNode = async (state: typeof StateAnnotation.State) => {
      try {
        const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/launcher-status`);
        return {
          jobData: {
            launcherStatus: response.data.status
          }
        };
      } catch (error) {
        console.log('Launcher status service not available, skipping...');
        return {
          jobData: {
            launcherStatus: 'unknown'
          }
        };
      }
    }

    const checkDBStatusNode = async (state: typeof StateAnnotation.State) => {
      try {
        const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/db-status`);
        return {
          jobData: {
            dbStatus: response.data.status
          }
        };
      } catch (error) {
        console.log('DB status service not available, skipping...');
        return {
          jobData: {
            dbStatus: 'unknown'
          }
        };
      }
    }

    const checkJobOrderNode = async (state: typeof StateAnnotation.State) => {
      try {
        const response = await axios.get<JobStatusResponse>(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/order-status`);
        return {
          jobData: {
            jobOrderStatus: response.data.status
          }
        };
      } catch (error) {
        console.log('Job order status service not available, skipping...');
        return {
          jobData: {
            jobOrderStatus: 'unknown'
          }
        };
      }
    }

    const checkSystemResourcesNode = async (state: typeof StateAnnotation.State) => {
      try {
        const response = await axios.get<SystemResourcesResponse>(`${this.baseUrl}/api/system/resources`);
        return {
          jobData: {
            systemResourcesStatus: `memory: ${response.data.memory}%, cpu: ${response.data.cpu}%, disk: ${response.data.disk}%, network in: ${response.data.network.in}%, network out: ${response.data.network.out}%`
          }
        };
      } catch (error) {
        console.log('System resources service not available, skipping...');
        return {
          jobData: {
            systemResourcesStatus: 'unknown'
          }
        };
      }
    }
    
    const debugJobNode = async (state: typeof StateAnnotation.State) => {
      // Include relevant chat history in the troubleshooting prompt
      const chatContext = state.chatHistory.slice(-3).join('\n');
      const msg = await this.llm.invoke(
        `Given the following chat history:
        ${chatContext}
        
        Troubleshoot the stream: ${state.streamName} 

        Stream Job Status:
        - Launcher Status: ${state.jobData.launcherStatus}
        - DB Status: ${state.jobData.dbStatus}
        - Job Order Status: ${state.jobData.jobOrderStatus}
        - System Resources Status: ${state.jobData.systemResourcesStatus}

        Can you help troubleshoot the stream?
        `
      );
      console.log("FINAL DEBUG STATE:", state);
      console.log("FINAL DEBUG RESPONSE:", msg.content);

      // Add the response to chat history
      state.chatHistory = [...state.chatHistory, msg.content.toString()];
      return { 
        message: msg.content,
        chatHistory: state.chatHistory,
        jobData: {
          report: msg.content.toString()
        }
      };
    }

    // Build workflow
    const chain = new StateGraph(StateAnnotation)
      .addNode("checkLauncherStatusNode", checkLauncherStatusNode)
      .addNode("checkDBStatusNode", checkDBStatusNode)
      .addNode("checkJobOrderNode", checkJobOrderNode)
      .addNode("checkSystemResourcesNode", checkSystemResourcesNode)
      .addNode("debugJobNode", debugJobNode)
      .addNode("beginNode", beginNode)
      .addEdge("__start__", "beginNode")
      // Fan out from beginNode to all check nodes
      .addEdge("beginNode", "checkLauncherStatusNode")
      .addEdge("beginNode", "checkDBStatusNode")
      .addEdge("beginNode", "checkJobOrderNode")
      .addEdge("beginNode", "checkSystemResourcesNode")
      // Join all check nodes to debugJobNode
      // debugJobNode will only run after all four preceding nodes complete
      .addEdge("checkLauncherStatusNode", "debugJobNode")
      .addEdge("checkDBStatusNode", "debugJobNode")
      .addEdge("checkJobOrderNode", "debugJobNode")
      .addEdge("checkSystemResourcesNode", "debugJobNode")
      .addEdge("debugJobNode", "__end__")
      .compile();

    return chain;
  }
  
  async invoke(state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State> {
    return await this.graph.invoke(state);
  }
}

export async function createJobGraph(dependencies: { 
  llm: BaseChatModel,
  baseUrl: string 
}) {
  return new JobGraph(dependencies.llm, dependencies);
} 