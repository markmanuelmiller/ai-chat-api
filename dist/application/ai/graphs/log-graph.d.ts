import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StateAnnotation } from './debug-stream-graph';
export declare class LogGraph {
    private graph;
    private llm;
    private baseUrl;
    constructor(llm: BaseChatModel, config: any);
    private buildGraph;
    invoke(state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State>;
}
export declare function createLogGraph(dependencies: {
    llm: BaseChatModel;
    baseUrl: string;
}): Promise<LogGraph>;
