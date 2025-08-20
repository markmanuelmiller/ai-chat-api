"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobGraph = void 0;
exports.createJobGraph = createJobGraph;
const langgraph_1 = require("@langchain/langgraph");
const axios_1 = __importDefault(require("axios"));
const debug_stream_graph_1 = require("./debug-stream-graph");
class JobGraph {
    constructor(llm, config) {
        this.llm = llm;
        this.baseUrl = config.mockServerUrl;
        this.graph = this.buildGraph();
    }
    buildGraph() {
        const beginNode = async (state) => {
            console.log("BASE URL:", this.baseUrl);
            return state;
        };
        const checkLauncherStatusNode = async (state) => {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/launcher-status`);
                return {
                    jobData: {
                        launcherStatus: response.data.status
                    }
                };
            }
            catch (error) {
                console.log('Launcher status service not available, skipping...');
                return {
                    jobData: {
                        launcherStatus: 'unknown'
                    }
                };
            }
        };
        const checkDBStatusNode = async (state) => {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/db-status`);
                return {
                    jobData: {
                        dbStatus: response.data.status
                    }
                };
            }
            catch (error) {
                console.log('DB status service not available, skipping...');
                return {
                    jobData: {
                        dbStatus: 'unknown'
                    }
                };
            }
        };
        const checkJobOrderNode = async (state) => {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/api/jobs/${state.jobData.jobId}/order-status`);
                return {
                    jobData: {
                        jobOrderStatus: response.data.status
                    }
                };
            }
            catch (error) {
                console.log('Job order status service not available, skipping...');
                return {
                    jobData: {
                        jobOrderStatus: 'unknown'
                    }
                };
            }
        };
        const checkSystemResourcesNode = async (state) => {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/api/system/resources`);
                return {
                    jobData: {
                        systemResourcesStatus: `memory: ${response.data.memory}%, cpu: ${response.data.cpu}%, disk: ${response.data.disk}%, network in: ${response.data.network.in}%, network out: ${response.data.network.out}%`
                    }
                };
            }
            catch (error) {
                console.log('System resources service not available, skipping...');
                return {
                    jobData: {
                        systemResourcesStatus: 'unknown'
                    }
                };
            }
        };
        const debugJobNode = async (state) => {
            // Include relevant chat history in the troubleshooting prompt
            const chatContext = state.chatHistory.slice(-3).join('\n');
            const msg = await this.llm.invoke(`Given the following chat history:
        ${chatContext}
        
        Troubleshoot the stream: ${state.streamName} 

        Stream Job Status:
        - Launcher Status: ${state.jobData.launcherStatus}
        - DB Status: ${state.jobData.dbStatus}
        - Job Order Status: ${state.jobData.jobOrderStatus}
        - System Resources Status: ${state.jobData.systemResourcesStatus}

        Can you help troubleshoot the stream?
        `);
            console.log("FINAL DEBUG STATE:", state);
            console.log("FINAL DEBUG RESPONSE:", msg.content);
            // Add the response to chat history
            state.chatHistory = [...state.chatHistory, msg.content.toString()];
            return {
                message: msg.content,
                chatHistory: state.chatHistory,
                jobData: {
                    report: msg.content.toString()
                }
            };
        };
        // Build workflow
        const chain = new langgraph_1.StateGraph(debug_stream_graph_1.StateAnnotation)
            .addNode("checkLauncherStatusNode", checkLauncherStatusNode)
            .addNode("checkDBStatusNode", checkDBStatusNode)
            .addNode("checkJobOrderNode", checkJobOrderNode)
            .addNode("checkSystemResourcesNode", checkSystemResourcesNode)
            .addNode("debugJobNode", debugJobNode)
            .addNode("beginNode", beginNode)
            .addEdge("__start__", "beginNode")
            // Fan out from beginNode to all check nodes
            .addEdge("beginNode", "checkLauncherStatusNode")
            .addEdge("beginNode", "checkDBStatusNode")
            .addEdge("beginNode", "checkJobOrderNode")
            .addEdge("beginNode", "checkSystemResourcesNode")
            // Join all check nodes to debugJobNode
            // debugJobNode will only run after all four preceding nodes complete
            .addEdge("checkLauncherStatusNode", "debugJobNode")
            .addEdge("checkDBStatusNode", "debugJobNode")
            .addEdge("checkJobOrderNode", "debugJobNode")
            .addEdge("checkSystemResourcesNode", "debugJobNode")
            .addEdge("debugJobNode", "__end__")
            .compile();
        return chain;
    }
    async invoke(state) {
        return await this.graph.invoke(state);
    }
}
exports.JobGraph = JobGraph;
async function createJobGraph(dependencies) {
    return new JobGraph(dependencies.llm, dependencies);
}
//# sourceMappingURL=job-graph.js.map