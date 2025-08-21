import { StateGraph } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StreamDoctorStateAnnotation } from './types/stream-doctor-state';
import { 
  isMetaDataOnly, 
  getData, 
  getMetaData, 
  analyzeData, 
  response, 
  shouldEnd 
} from './nodes/stream-doctor-nodes';

export class StreamDoctorGraph {
  private graph: any;
  private llm: BaseChatModel;
  
  constructor(llm: BaseChatModel) {
    this.llm = llm;
    this.graph = this.buildGraph();
  }
  
  private buildGraph(): any {
    // Create node functions that bind the LLM
    const isMetaDataOnlyNode = async (state: typeof StreamDoctorStateAnnotation.State) => {
      return await isMetaDataOnly(state, this.llm);
    };

    const getDataNode = async (state: typeof StreamDoctorStateAnnotation.State) => {
      return await getData(state, this.llm);
    };

    const getMetaDataNode = async (state: typeof StreamDoctorStateAnnotation.State) => {
      return await getMetaData(state, this.llm);
    };

    const analyzeDataNode = async (state: typeof StreamDoctorStateAnnotation.State) => {
      return await analyzeData(state, this.llm);
    };

    const responseNode = async (state: typeof StreamDoctorStateAnnotation.State) => {
      return await response(state, this.llm);
    };

    // Build the workflow graph
    const workflow = new StateGraph(StreamDoctorStateAnnotation)
      .addNode("isMetaDataOnly", isMetaDataOnlyNode)
      .addNode("getMetaData", getMetaDataNode)
      .addNode("getData", getDataNode)
      .addNode("analyzeData", analyzeDataNode)
      .addNode("response", responseNode)
      .addEdge("__start__", "isMetaDataOnly")
      .addConditionalEdges("isMetaDataOnly", shouldEnd, {
        true: "response",
        false: "getMetaData"
      })
      .addConditionalEdges("getMetaData", shouldEnd, {
        true: "response",
        false: "getData"
      })
      .addConditionalEdges("getData", shouldEnd, {
        true: "response",
        false: "analyzeData",
      })
      .addEdge("analyzeData", "response")
      .addEdge("response", "__end__");

    // Compile the graph
    return workflow.compile();
  }
  
  /**
   * Runs the graph with the given input state
   * @param initialState Initial state for the graph
   * @returns The final state after graph execution
   */
  async invoke(initialState: Partial<typeof StreamDoctorStateAnnotation.State>): Promise<typeof StreamDoctorStateAnnotation.State> {
    console.log('StreamDoctorGraph invoke - initialState:', initialState);
    const result = await this.graph.invoke(initialState as typeof StreamDoctorStateAnnotation.State);
    console.log('StreamDoctorGraph invoke - result:', result);
    return result;
  }
  
  /**
   * Streams the graph execution with the given input state
   * @param initialState Initial state for the graph
   * @returns A stream of state updates
   */
  async stream(initialState: Partial<typeof StreamDoctorStateAnnotation.State>): Promise<AsyncIterable<typeof StreamDoctorStateAnnotation.State>> {
    console.log('StreamDoctorGraph stream - initialState:', initialState);
    const result = await this.graph.stream(initialState as typeof StreamDoctorStateAnnotation.State);
    console.log('StreamDoctorGraph stream - result:', result);
    return result;
  }
}

export async function createStreamDoctorGraph(dependencies: { 
  llm: BaseChatModel
}) {
  return new StreamDoctorGraph(dependencies.llm);
}
