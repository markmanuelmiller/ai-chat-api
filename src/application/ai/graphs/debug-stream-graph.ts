import { StateGraph, Annotation, MemorySaver } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import axios from 'axios';
import { logger } from '@/utils/logger';
import { 
  isMetaDataOnly, 
  getData, 
  getMetaData, 
  analyzeData, 
  response, 
  shouldEnd 
} from './nodes/stream-doctor-nodes';

// Zod schema for intent validation
const IntentSchema = z.object({
  intent: z.enum(['debug stream', 'other']).describe('The detected intent from the user message')
});

const INTENT_PROMPT = `Classify the intent as one of the following: ${IntentSchema.shape.intent._def.values.map(opt => `"${opt}"`).join(', ')}.`;


export const StateAnnotation = Annotation.Root({
  chatId: Annotation<string>,
  message: Annotation<string>, // user message
  intent: Annotation<string>,
  chatHistory: Annotation<string[]>,
  toolsHistory: Annotation<Array<{toolName: string, output: string}>>({
    reducer: (prev: Array<{toolName: string, output: string}>, next: Array<{toolName: string, output: string}>) => [...prev, ...next],
    default: () => []
  }),
  result: Annotation<string>,
  streamingMessage: Annotation<string>,
  error: Annotation<string>
});

export class DebugStreamGraph {
  private graph: any;
  private llm: BaseChatModel;
  
  constructor(
    llm: BaseChatModel, 
    config: any
  ) {
    this.llm = llm;
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

      logger.info('INTENT', state.intent);
      state.streamingMessage = result.intent;
      return state;
    }

    const debugStreamRouter = (state: typeof StateAnnotation.State) => {
      if (state.intent.includes("debug")) return "Debug";
      return "Fail";
    };

    // Stream Doctor workflow nodes
    const isMetaDataOnlyNode = async (state: typeof StateAnnotation.State) => {
      return await isMetaDataOnly(state, this.llm);
    };

    const getDataNode = async (state: typeof StateAnnotation.State) => {
      return await getData(state, this.llm);
    };

    const getMetaDataNode = async (state: typeof StateAnnotation.State) => {
      return await getMetaData(state, this.llm);
    };

    const analyzeDataNode = async (state: typeof StateAnnotation.State) => {
      return await analyzeData(state, this.llm);
    };

    const responseNode = async (state: typeof StateAnnotation.State) => {
      return await response(state, this.llm);
    };


    // add a node that asks llm for intent type "other" 
    const otherIntentNode = async (state: typeof StateAnnotation.State) => {
      const msg = await this.llm.invoke(state.message);
      state.intent = "other";
      return {
        result: msg.content.toString()
      }
    }

    // Build workflow
    const chain = new StateGraph(StateAnnotation)
      .addNode("intakeMessageNode", intakeMessageNode)
      .addNode("determineIntentNode", determineIntentNode)
      .addNode("isMetaDataOnly", isMetaDataOnlyNode)
      .addNode("getMetaData", getMetaDataNode)
      .addNode("getData", getDataNode)
      .addNode("analyzeData", analyzeDataNode)
      .addNode("response", responseNode)
      .addNode("otherIntentNode", otherIntentNode)
      .addEdge("__start__", "intakeMessageNode")
      .addEdge("intakeMessageNode", "determineIntentNode")
      .addConditionalEdges("determineIntentNode", debugStreamRouter, {
        Debug: "isMetaDataOnly", 
        Fail: "otherIntentNode"
      })
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
      .addEdge("response", "__end__")
      .addEdge("otherIntentNode", "__end__");

    const memory = new MemorySaver();

    return chain.compile({
      checkpointer: memory,
    });
  }
  
  /**
   * Runs the graph with the given input state
   * @param initialState Initial state for the graph
   * @returns The final state after graph execution
   */
  async invoke(initialState: Partial<typeof StateAnnotation.State>): Promise<typeof StateAnnotation.State> {
    logger.info('initialState from invoke', initialState);
    const threadId = initialState.chatId;
    const config = { configurable: { thread_id: threadId } };
    const result = await this.graph.invoke(initialState as typeof StateAnnotation.State, config);
    logger.info('result from graph from invoke', result);
    return result;
  }
  
  /**
   * Streams the graph execution with the given input state
   * @param initialState Initial state for the graph
   * @returns A stream of state updates
   */
  async stream(initialState: Partial<typeof StateAnnotation.State>): Promise<AsyncIterable<typeof StateAnnotation.State>> {
    logger.info('initialState from stream', initialState);
    const threadId = initialState.chatId;
    const config = { configurable: { thread_id: threadId } };
    const result = await this.graph.stream(initialState as typeof StateAnnotation.State, config);
    logger.info('result from graph from stream', result);
    return result;
  }
}

export async function createGraph(dependencies: { 
  llm: BaseChatModel,
  baseUrl: string 
}) {
  return new DebugStreamGraph(dependencies.llm, dependencies);
}
