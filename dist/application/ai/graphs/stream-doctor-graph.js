"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamDoctorGraph = void 0;
exports.createStreamDoctorGraph = createStreamDoctorGraph;
const langgraph_1 = require("@langchain/langgraph");
const stream_doctor_state_1 = require("./types/stream-doctor-state");
const stream_doctor_nodes_1 = require("./nodes/stream-doctor-nodes");
class StreamDoctorGraph {
    constructor(llm) {
        this.llm = llm;
        this.graph = this.buildGraph();
    }
    buildGraph() {
        // Create node functions that bind the LLM
        const isMetaDataOnlyNode = async (state) => {
            return await (0, stream_doctor_nodes_1.isMetaDataOnly)(state, this.llm);
        };
        const getDataNode = async (state) => {
            return await (0, stream_doctor_nodes_1.getData)(state, this.llm);
        };
        const getMetaDataNode = async (state) => {
            return await (0, stream_doctor_nodes_1.getMetaData)(state, this.llm);
        };
        const analyzeDataNode = async (state) => {
            return await (0, stream_doctor_nodes_1.analyzeData)(state, this.llm);
        };
        const responseNode = async (state) => {
            return await (0, stream_doctor_nodes_1.response)(state, this.llm);
        };
        // Build the workflow graph
        const workflow = new langgraph_1.StateGraph(stream_doctor_state_1.StreamDoctorStateAnnotation)
            .addNode("isMetaDataOnly", isMetaDataOnlyNode)
            .addNode("getMetaData", getMetaDataNode)
            .addNode("getData", getDataNode)
            .addNode("analyzeData", analyzeDataNode)
            .addNode("response", responseNode)
            .addEdge("__start__", "isMetaDataOnly")
            .addConditionalEdges("isMetaDataOnly", stream_doctor_nodes_1.shouldEnd, {
            true: "response",
            false: "getMetaData"
        })
            .addConditionalEdges("getMetaData", stream_doctor_nodes_1.shouldEnd, {
            true: "response",
            false: "getData"
        })
            .addConditionalEdges("getData", stream_doctor_nodes_1.shouldEnd, {
            true: "response",
            false: "analyzeData",
        })
            .addEdge("analyzeData", "response")
            .addEdge("response", "__end__");
        // Compile the graph
        return workflow.compile();
    }
    /**
     * Runs the graph with the given input state
     * @param initialState Initial state for the graph
     * @returns The final state after graph execution
     */
    async invoke(initialState) {
        console.log('StreamDoctorGraph invoke - initialState:', initialState);
        const result = await this.graph.invoke(initialState);
        console.log('StreamDoctorGraph invoke - result:', result);
        return result;
    }
    /**
     * Streams the graph execution with the given input state
     * @param initialState Initial state for the graph
     * @returns A stream of state updates
     */
    async stream(initialState) {
        console.log('StreamDoctorGraph stream - initialState:', initialState);
        const result = await this.graph.stream(initialState);
        console.log('StreamDoctorGraph stream - result:', result);
        return result;
    }
}
exports.StreamDoctorGraph = StreamDoctorGraph;
async function createStreamDoctorGraph(dependencies) {
    return new StreamDoctorGraph(dependencies.llm);
}
//# sourceMappingURL=stream-doctor-graph.js.map