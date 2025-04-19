import { StateGraph, Annotation } from '@langchain/langgraph';
import { Runnable } from '@langchain/core/runnables';
import { GraphState } from './types/state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

// Import nodes
// import { createDetectIntentNode } from './nodes/detect-intent';
// import { createRequestFiltersNode } from './nodes/request-filters';
// import { createExtractStreamNameNode } from './nodes/extract-stream-name';
// import { createHandleOtherIntentNode } from './nodes/handle-other-intent';
// import { createConfirmToolArgsNode } from './nodes/confirm-tool-args';
// import { createExecuteLogToolNode } from './nodes/execute-log-tool';
// import { createAnalyzeLogsNode } from './nodes/analyze-logs';
// import { createProposeNextStepNode } from './nodes/propose-next-step';
// import { createProcessNextStepChoiceNode } from './nodes/process-next-step-choice';
// import { createHandleToolErrorNode } from './nodes/handle-tool-error';

export class LogAnalysisGraph {
  private graph: StateGraph<GraphState>;
  private llm: BaseChatModel;
  
  constructor(llm: BaseChatModel) {
    this.llm = llm;
    
    // Build the graph
    this.graph = this.buildGraph();
  }
  
  private buildGraph(): StateGraph<GraphState> {

    // Graph state
    const StateAnnotation = Annotation.Root({
      topic: Annotation<string>,
      joke: Annotation<string>,
      improvedJoke: Annotation<string>,
      finalJoke: Annotation<string>,
    });

    // Define node functions

    // First LLM call to generate initial joke
    const generateJoke = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(`Write a short joke about ${state.topic}`);
      return { joke: msg.content };
    }

    // Gate function to check if the joke has a punchline
    const checkPunchline = (state: typeof StateAnnotation.State) => {
      // Simple check - does the joke contain "?" or "!"
      if (state.joke?.includes("?") || state.joke?.includes("!")) {
        return "Pass";
      }
      return "Fail";
    }

      // Second LLM call to improve the joke
    const improveJoke = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Make this joke funnier by adding wordplay: ${state.joke}`
      );
      return { improvedJoke: msg.content };
    }

    // Third LLM call for final polish
    const polishJoke = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(
        `Add a surprising twist to this joke: ${state.improvedJoke}`
      );
      return { finalJoke: msg.content };
    }

    // Build workflow
    const chain = new StateGraph(StateAnnotation)
      .addNode("generateJoke", generateJoke)
      .addNode("improveJoke", improveJoke)
      .addNode("polishJoke", polishJoke)
      .addEdge("__start__", "generateJoke")
      .addConditionalEdges("generateJoke", checkPunchline, {
        Pass: "improveJoke",
        Fail: "__end__"
      })
      .addEdge("improveJoke", "polishJoke")
      .addEdge("polishJoke", "__end__")
      .compile();

    return chain;
    
  }
  
  /**
   * Runs the graph with the given input state
   * @param initialState Initial state for the graph
   * @returns The final state after graph execution
   */
  async invoke(initialState: Partial<GraphState>): Promise<GraphState> {
    return await this.graph.invoke(initialState as GraphState);
  }
  
  /**
   * Streams the graph execution with the given input state
   * @param initialState Initial state for the graph
   * @returns A stream of state updates
   */
  async stream(initialState: Partial<GraphState>): Promise<AsyncIterable<GraphState>> {
    return await this.graph.stream(initialState as GraphState);
  }
} 