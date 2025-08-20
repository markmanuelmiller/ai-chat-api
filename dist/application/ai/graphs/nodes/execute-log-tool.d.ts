import { RunnableLambda } from '@langchain/core/runnables';
import { GraphState } from '../types/state';
/**
 * In a real implementation, this would connect to your actual log storage/retrieval system.
 * This could be Elasticsearch, CloudWatch, DataDog, or a custom log storage solution.
 */
export declare function createExecuteLogToolNode(): RunnableLambda<GraphState, Partial<GraphState>, import("@langchain/core/runnables").RunnableConfig<Record<string, any>>>;
