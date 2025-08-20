import { RunnableLambda } from '@langchain/core/runnables';
import { GraphState } from '../types/state';
export declare function createHandleOtherIntentNode(): RunnableLambda<GraphState, Partial<GraphState>, import("@langchain/core/runnables").RunnableConfig<Record<string, any>>>;
