import { StateGraph, Annotation } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import axios from 'axios';
import { StateAnnotation, LogDataAnnotation } from './debug-stream-graph';

interface LogResponse {
  logs: string[];
  errors: string[];
  warnings: string[];
}

export class LogGraph {
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
    const collectLogsNode = async (state: typeof StateAnnotation.State) => {
      try {
        console.log('Fetching logs for stream:', state.streamName);
        const response = await axios.get<LogResponse>(`${this.baseUrl}/api/streams/${state.streamName}/logs`);
        console.log('Received logs:', response.data);
        return {
          ...state,
          logData: {
            logs: response.data.logs,
            errors: response.data.errors,
            warnings: response.data.warnings,
            analysis: ''
          }
        };
      } catch (error) {
        console.log('Log collection service not available, skipping...', error);
        return {
          ...state,
          logData: {
            logs: [],
            errors: ['Log collection service unavailable'],
            warnings: [],
            analysis: ''
          }
        };
      }
    }

    const analyzeLogsNode = async (state: typeof StateAnnotation.State) => {
      const logs = state.logData.logs.join('\n');
      const errors = state.logData.errors.join('\n');
      const warnings = state.logData.warnings.join('\n');

      const msg = await this.llm.invoke(
        `Analyze the following logs for stream ${state.streamName}:

        Logs:
        ${logs}

        Errors:
        ${errors}

        Warnings:
        ${warnings}

        Please provide a detailed analysis of any patterns, issues, or notable events.
        Focus on identifying potential problems and their root causes.`
      );

      return {
        ...state,
        logData: {
          ...state.logData,
          analysis: msg.content.toString()
        }
      };
    }

    // Build workflow
    const chain = new StateGraph(StateAnnotation)
      .addNode("collectLogsNode", collectLogsNode)
      .addNode("analyzeLogsNode", analyzeLogsNode)
      .addEdge("__start__", "collectLogsNode")
      .addEdge("collectLogsNode", "analyzeLogsNode")
      .addEdge("analyzeLogsNode", "__end__")
      .compile();

    return chain;
  }
  
  async invoke(state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State> {
    return await this.graph.invoke(state);
  }
}

export async function createLogGraph(dependencies: { 
  llm: BaseChatModel,
  baseUrl: string 
}) {
  return new LogGraph(dependencies.llm, dependencies);
} 