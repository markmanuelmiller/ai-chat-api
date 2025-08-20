import { RunnableLambda } from '@langchain/core/runnables';
import { GraphState } from '../types/state';
export declare function createExtractStreamNameNode(): RunnableLambda<GraphState, Partial<GraphState>, import("@langchain/core/runnables").RunnableConfig<Record<string, any>>>;
