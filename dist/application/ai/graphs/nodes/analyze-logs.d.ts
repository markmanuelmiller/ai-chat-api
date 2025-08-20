import { RunnableLambda } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { GraphState } from '../types/state';
export declare function createAnalyzeLogsNode(llm: ChatOpenAI): RunnableLambda<GraphState, Partial<GraphState>, import("@langchain/core/runnables").RunnableConfig<Record<string, any>>>;
