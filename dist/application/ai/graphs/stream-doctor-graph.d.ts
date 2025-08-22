import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StreamDoctorStateAnnotation } from './types/stream-doctor-state';
export declare class StreamDoctorGraph {
    private graph;
    private llm;
    constructor(llm: BaseChatModel);
    private buildGraph;
    /**
     * Runs the graph with the given input state
     * @param initialState Initial state for the graph
     * @returns The final state after graph execution
     */
    invoke(initialState: Partial<typeof StreamDoctorStateAnnotation.State>): Promise<typeof StreamDoctorStateAnnotation.State>;
    /**
     * Streams the graph execution with the given input state
     * @param initialState Initial state for the graph
     * @returns A stream of state updates
     */
    stream(initialState: Partial<typeof StreamDoctorStateAnnotation.State>): Promise<AsyncIterable<typeof StreamDoctorStateAnnotation.State>>;
}
export declare function createStreamDoctorGraph(dependencies: {
    llm: BaseChatModel;
}): Promise<StreamDoctorGraph>;
