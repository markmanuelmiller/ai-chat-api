import { StateGraph, Annotation } from '@langchain/langgraph';
import { Runnable } from '@langchain/core/runnables';
import { GraphState } from './types/state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

// Graph state
export const StateAnnotation = Annotation.Root({
  intent: Annotation<string>,
  streamName: Annotation<string>,
  message: Annotation<string>,
  chatId: Annotation<string>,
});

export class VideoPipelineAssistantGraph {
  private graph: any;
  private llm: BaseChatModel;
  
  constructor(llm: BaseChatModel) {
    this.llm = llm;
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

    const router = (state: typeof StateAnnotation.State) => 
      state.intent === "troubleshoot_stream" ? "Pass" : "Fail";

    const streamNameNode = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Extract the stream name from the following message: ${state.message}. Respond only with the stream name.`
      );
      state.streamName = msg.content.toString();
      return state;
    }

    const troubleshootStreamNode = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Troubleshoot the stream: ${state.streamName}`
      );
      return { message: msg.content };
    }

    // Build workflow
    const chain = new StateGraph(StateAnnotation)
      .addNode("intakeMessageNode", intakeMessageNode)
      .addNode("determineIntentNode", determineIntentNode)
      .addNode("streamNameNode", streamNameNode)
      .addNode("troubleshootStreamNode", troubleshootStreamNode)
      .addEdge("__start__", "intakeMessageNode")
      .addEdge("intakeMessageNode", "determineIntentNode")
      .addConditionalEdges("determineIntentNode", router, {
        Pass: "streamNameNode",
        Fail: "__end__"
      })
      .addEdge("streamNameNode", "troubleshootStreamNode")
      .addEdge("troubleshootStreamNode", "__end__")
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