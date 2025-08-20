"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugStreamGraph = exports.StateAnnotation = exports.LogDataAnnotation = exports.JobDataAnnotation = exports.DebugParamsAnnotation = void 0;
exports.createGraph = createGraph;
const langgraph_1 = require("@langchain/langgraph");
const axios_1 = __importDefault(require("axios"));
const job_graph_1 = require("./job-graph");
const log_graph_1 = require("./log-graph");
// Graph state
exports.DebugParamsAnnotation = langgraph_1.Annotation.Root({
    start: (langgraph_1.Annotation),
    end: (langgraph_1.Annotation),
    timezone: (langgraph_1.Annotation),
    streamType: (langgraph_1.Annotation),
    streamStatus: (langgraph_1.Annotation),
    streamError: (langgraph_1.Annotation),
    streamErrorDescription: (langgraph_1.Annotation),
});
exports.JobDataAnnotation = langgraph_1.Annotation.Root({
    jobId: (langgraph_1.Annotation),
    launcherStatus: (langgraph_1.Annotation),
    dbStatus: (langgraph_1.Annotation),
    jobOrderStatus: (langgraph_1.Annotation),
    systemResourcesStatus: (langgraph_1.Annotation),
    report: (langgraph_1.Annotation)
});
exports.LogDataAnnotation = langgraph_1.Annotation.Root({
    logs: (langgraph_1.Annotation),
    errors: (langgraph_1.Annotation),
    warnings: (langgraph_1.Annotation),
    analysis: (langgraph_1.Annotation)
});
exports.StateAnnotation = langgraph_1.Annotation.Root({
    chatId: (langgraph_1.Annotation),
    message: (langgraph_1.Annotation), // user message
    intent: (langgraph_1.Annotation),
    chatHistory: (langgraph_1.Annotation),
    streamName: (langgraph_1.Annotation),
    debugParams: (langgraph_1.Annotation),
    jobData: (0, langgraph_1.Annotation)({
        reducer: (prev, next) => ({
            ...prev,
            ...next
        })
    }),
    logData: (0, langgraph_1.Annotation)({
        reducer: (prev, next) => ({
            ...prev,
            ...next
        })
    }),
    finalReport: (langgraph_1.Annotation),
    streamingMessages: (0, langgraph_1.Annotation)({
        reducer: (prev, next) => [...prev, ...next]
    })
});
class DebugStreamGraph {
    constructor(llm, config) {
        this.llm = llm;
        this.baseUrl = config.mockServerUrl;
        this.jobGraph = new job_graph_1.JobGraph(llm, config);
        this.logGraph = new log_graph_1.LogGraph(llm, config);
        this.graph = this.buildGraph();
    }
    buildGraph() {
        const intakeMessageNode = async (state) => {
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
        const determineIntentNode = async (state) => {
            // Include chat history in the prompt for better context
            const chatContext = state.chatHistory.slice(-3).join('\n');
            const msg = await this.llm.invoke(`Given the following chat history:
        ${chatContext}
        
        Determine the intent of the most recent message: ${state.message}. 
        Respond only with one of the following: "debug_stream", "other".`);
            state.intent = msg.content.toString();
            return state;
        };
        const streamDebugDataCollectorNode = async (state) => {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/api/streams/${state.streamName}/status`);
                return {
                    streamStatus: response.data.status,
                    streamError: response.data.error ?? '',
                    streamErrorDescription: response.data.errorDescription ?? '',
                    streamingMessages: [`Fetching status for stream ${state.streamName}...`]
                };
            }
            catch (error) {
                console.log('Stream status service not available, skipping...');
                return {
                    streamStatus: 'unknown',
                    streamError: 'Service unavailable',
                    streamErrorDescription: 'The stream status service is not available',
                    streamingMessages: [`Error: Unable to fetch stream status for ${state.streamName}`]
                };
            }
        };
        const debugStreamRouter = (state) => state.intent === "debug_stream" ? "Pass" : "Fail";
        const streamNameNode = async (state) => {
            const msg = await this.llm.invoke(`Extract the stream name from the following message: ${state.message}. Respond only with the stream name.`);
            return {
                streamName: msg.content.toString(),
                jobData: {
                    jobId: "123"
                }
            };
        };
        const processSubgraphsNode = async (state) => {
            // Run both subgraphs in parallel
            const [jobResult, logResult] = await Promise.all([
                this.jobGraph.invoke(state),
                this.logGraph.invoke(state)
            ]);
            // Combine the results
            return {
                ...state,
                jobData: jobResult.jobData,
                logData: logResult.logData,
                streamingMessages: [
                    'Processing job data...',
                    'Analyzing logs...',
                    'Combining results...'
                ]
            };
        };
        const generateFinalReportNode = async (state) => {
            const msg = await this.llm.invoke(`Generate a final report for the following stream: ${state.streamName}

        Job Status Information:
        ${state.jobData.report}

        Log Analysis:
        ${state.logData.analysis}

        Please provide a comprehensive report that combines both the job status and log analysis.
        Highlight any correlations between job issues and log patterns.
        Provide actionable insights and recommendations.`);
            return {
                finalReport: msg.content.toString(),
                streamingMessages: ['Generating final report...']
            };
        };
        // Build workflow
        const chain = new langgraph_1.StateGraph(exports.StateAnnotation)
            .addNode("intakeMessageNode", intakeMessageNode)
            .addNode("determineIntentNode", determineIntentNode)
            .addNode("streamNameNode", streamNameNode)
            .addNode("streamDebugDataCollectorNode", streamDebugDataCollectorNode)
            .addNode("processSubgraphsNode", processSubgraphsNode)
            .addNode("generateFinalReportNode", generateFinalReportNode)
            .addEdge("__start__", "intakeMessageNode")
            .addEdge("intakeMessageNode", "determineIntentNode")
            .addConditionalEdges("determineIntentNode", debugStreamRouter, {
            Pass: "streamNameNode",
            Fail: "__end__"
        })
            .addEdge("streamNameNode", "streamDebugDataCollectorNode")
            .addEdge("streamDebugDataCollectorNode", "processSubgraphsNode")
            .addEdge("processSubgraphsNode", "generateFinalReportNode")
            .addEdge("generateFinalReportNode", "__end__")
            .compile();
        return chain;
    }
    /**
     * Runs the graph with the given input state
     * @param initialState Initial state for the graph
     * @returns The final state after graph execution
     */
    async invoke(initialState) {
        console.log('initialState from invoke', initialState);
        const result = await this.graph.invoke(initialState);
        console.log('result from graph from invoke', result);
        return result;
    }
    /**
     * Streams the graph execution with the given input state
     * @param initialState Initial state for the graph
     * @returns A stream of state updates
     */
    async stream(initialState) {
        console.log('initialState from stream', initialState);
        const result = await this.graph.stream(initialState);
        console.log('result from graph from stream', result);
        return result;
    }
}
exports.DebugStreamGraph = DebugStreamGraph;
async function createGraph(dependencies) {
    return new DebugStreamGraph(dependencies.llm, dependencies);
}
//# sourceMappingURL=debug-stream-graph.js.map