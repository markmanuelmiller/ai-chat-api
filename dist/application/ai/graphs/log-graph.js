"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogGraph = void 0;
exports.createLogGraph = createLogGraph;
const langgraph_1 = require("@langchain/langgraph");
const axios_1 = __importDefault(require("axios"));
const debug_stream_graph_1 = require("./debug-stream-graph");
class LogGraph {
    constructor(llm, config) {
        this.llm = llm;
        this.baseUrl = config.mockServerUrl;
        this.graph = this.buildGraph();
    }
    buildGraph() {
        const collectLogsNode = async (state) => {
            try {
                console.log('Fetching logs for stream:', state.streamName);
                const response = await axios_1.default.get(`${this.baseUrl}/api/streams/${state.streamName}/logs`);
                console.log('Received logs:', response.data);
                return {
                    ...state,
                    logData: {
                        logs: response.data.logs,
                        errors: response.data.errors,
                        warnings: response.data.warnings,
                        analysis: ''
                    }
                };
            }
            catch (error) {
                console.log('Log collection service not available, skipping...', error);
                return {
                    ...state,
                    logData: {
                        logs: [],
                        errors: ['Log collection service unavailable'],
                        warnings: [],
                        analysis: ''
                    }
                };
            }
        };
        const analyzeLogsNode = async (state) => {
            const logs = state.logData.logs.join('\n');
            const errors = state.logData.errors.join('\n');
            const warnings = state.logData.warnings.join('\n');
            const msg = await this.llm.invoke(`Analyze the following logs for stream ${state.streamName}:

        Logs:
        ${logs}

        Errors:
        ${errors}

        Warnings:
        ${warnings}

        Please provide a detailed analysis of any patterns, issues, or notable events.
        Focus on identifying potential problems and their root causes.`);
            return {
                ...state,
                logData: {
                    ...state.logData,
                    analysis: msg.content.toString()
                }
            };
        };
        // Build workflow
        const chain = new langgraph_1.StateGraph(debug_stream_graph_1.StateAnnotation)
            .addNode("collectLogsNode", collectLogsNode)
            .addNode("analyzeLogsNode", analyzeLogsNode)
            .addEdge("__start__", "collectLogsNode")
            .addEdge("collectLogsNode", "analyzeLogsNode")
            .addEdge("analyzeLogsNode", "__end__")
            .compile();
        return chain;
    }
    async invoke(state) {
        return await this.graph.invoke(state);
    }
}
exports.LogGraph = LogGraph;
async function createLogGraph(dependencies) {
    return new LogGraph(dependencies.llm, dependencies);
}
//# sourceMappingURL=log-graph.js.map