import { ChatAnthropic } from '@langchain/anthropic';
import { DebugStreamGraph } from '../../application/ai/graphs/debug-stream-graph';
import { MockServer } from '../mocks/server';

// Increase global timeout to 30 seconds
jest.setTimeout(30000);

const config = {
  mockServerUrl: 'http://localhost:3001',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY
}

describe('Debug Stream Graph Integration', () => {
  // let mockServer: MockServer;
  let graph: DebugStreamGraph;

  beforeAll(async () => {
    // Start mock server
    // mockServer = new MockServer();
    // await mockServer.start();

    // Initialize graph with mock server URL
    const llm = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-latest",
      temperature: 0,
      ...(config.anthropicApiKey ? { apiKey: config.anthropicApiKey } : {})
    });
    graph = new DebugStreamGraph(llm, config);
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
  }, 30000); // 30 second timeout for this specific test
}); 