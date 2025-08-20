"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anthropic_1 = require("@langchain/anthropic");
const debug_stream_graph_1 = require("../../application/ai/graphs/debug-stream-graph");
// Increase global timeout to 30 seconds
// jest.setTimeout(30000);
jest.setTimeout(60000);
const config = {
    mockServerUrl: 'http://localhost:3001',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
};
describe('Debug Stream Graph Integration', () => {
    // let mockServer: MockServer;
    let graph;
    beforeAll(async () => {
        // Start mock server
        // mockServer = new MockServer();
        // await mockServer.start();
        // Initialize graph with mock server URL
        const llm = new anthropic_1.ChatAnthropic({
            modelName: "claude-3-7-sonnet-latest",
            temperature: 0,
            ...(config.anthropicApiKey ? { apiKey: config.anthropicApiKey } : {})
        });
        graph = new debug_stream_graph_1.DebugStreamGraph(llm, config);
    });
    afterAll(async () => {
        // await mockServer.stop();
    });
    it('should troubleshoot a stream', async () => {
        const initialState = {
            chatId: 'test-chat-2',
            message: 'Can you check what\'s wrong with stream test-stream-1?',
            jobData: {
                jobId: 'test-job-2',
                launcherStatus: '',
                dbStatus: '',
                jobOrderStatus: '',
                systemResourcesStatus: '',
                report: ''
            },
            debugParams: {
                start: '',
                end: '',
                timezone: '',
                streamType: '',
                streamStatus: '',
                streamError: '',
                streamErrorDescription: ''
            },
            logData: {
                logs: [],
                errors: [],
                warnings: [],
                analysis: ''
            }
        };
        const result = await graph.invoke(initialState);
        // Verify the result contains the expected data
        expect(result.jobData.launcherStatus).toBeDefined();
        expect(result.jobData.dbStatus).toBeDefined();
        expect(result.jobData.jobOrderStatus).toBeDefined();
        expect(result.jobData.systemResourcesStatus).toBeDefined();
        expect(result.debugParams.streamStatus).toBeDefined();
    }, 60000); // 60 second timeout for this specific test
});
//# sourceMappingURL=debug-stream.test.js.map