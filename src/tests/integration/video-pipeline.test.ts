import { ChatAnthropic } from '@langchain/anthropic';
import { VideoPipelineAssistantGraph } from '../../application/ai/graphs/video-pipeline-graph';
import { MockServer } from '../mocks/server';

// Increase global timeout to 30 seconds
jest.setTimeout(30000);

describe('Video Pipeline Graph Integration', () => {
  let mockServer: MockServer;
  let graph: VideoPipelineAssistantGraph;

  beforeAll(async () => {
    // Start mock server
    mockServer = new MockServer();
    await mockServer.start();

    // Initialize graph with mock server URL
    const llm = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-latest",
      temperature: 0,
      ...(process.env.ANTHROPIC_API_KEY ? { apiKey: process.env.ANTHROPIC_API_KEY } : {})
    });
    graph = new VideoPipelineAssistantGraph(llm, mockServer.getBaseUrl());
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  it('should troubleshoot a stream', async () => {
    const initialState = {
      chatId: 'test-chat-1',
      message: 'Can you check what\'s wrong with stream test-stream-1?',
      jobData: {
        jobId: 'test-job-1',
        launcherStatus: '',
        dbStatus: '',
        jobOrderStatus: '',
        systemResourcesStatus: ''
      },
      debugParams: {
        start: '',
        end: '',
        streamName: '',
        streamType: '',
        streamStatus: '',
        streamError: '',
        streamErrorDescription: ''
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