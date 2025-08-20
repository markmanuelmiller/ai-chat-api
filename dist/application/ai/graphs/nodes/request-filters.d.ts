import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { GraphState } from '../types/state';
export declare function createRequestFiltersNode(llm: ChatOpenAI): RunnableSequence<GraphState, Partial<GraphState>>;
