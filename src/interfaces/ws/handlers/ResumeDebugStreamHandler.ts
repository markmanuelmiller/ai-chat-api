import { WebSocketMessageHandler } from './WebSocketMessageHandler';
import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';
import { AIService } from '@/application/services/AIService';
import { logger } from '@/utils/logger';
import { StateAnnotation } from '@/application/ai/graphs/debug-stream-graph';

export interface ResumeDebugStreamPayload {
  sessionId: string;
  resumeState: typeof StateAnnotation.State;
  userConfirmation: boolean;
}

export class ResumeDebugStreamHandler implements WebSocketMessageHandler {
  constructor(private readonly aiService: AIService) {}

  async handle(
    client: AuthenticatedClient,
    payload: ResumeDebugStreamPayload,
    manager: WebSocketManager,
  ): Promise<void> {
    const { sessionId, resumeState, userConfirmation } = payload;

    if (!sessionId || resumeState === undefined || userConfirmation === undefined) {
      const errorMsg = JSON.stringify({
        type: 'error',
        error: 'sessionId, resumeState, and userConfirmation are required for resuming the stream.',
        sessionId: sessionId,
      });
      logger.warn('[ResumeDebugStreamHandler] Invalid payload for resume:', payload);
      client.send(errorMsg);
      return;
    }

    try {
      logger.info(`[ResumeDebugStreamHandler] Received RESUME_DEBUG_STREAM for session ${sessionId}, userConfirmation: ${userConfirmation}`);
      
      client.send(JSON.stringify({
        type: 'resume_ack',
        sessionId,
        message: 'Resume command received, attempting to continue stream.',
      }));

      await this.aiService.resumeDebugStream(sessionId, resumeState, userConfirmation);
      
      logger.info(`[ResumeDebugStreamHandler] AIService.resumeDebugStream called for session ${sessionId}. Further updates will be streamed.`);

    } catch (error) {
      logger.error(`[ResumeDebugStreamHandler] Error processing RESUME_DEBUG_STREAM for session ${sessionId}:`, error);
      client.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process resume_debug_stream command.',
        details: (error as Error).message,
        sessionId: sessionId,
      }));
    }
  }
} 