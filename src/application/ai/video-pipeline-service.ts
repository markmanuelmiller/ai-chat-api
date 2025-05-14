import { Logger } from '@nestjs/common';
import { VideoPipelineAssistantGraph } from './graphs/video-pipeline-graph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StateAnnotation } from './graphs/video-pipeline-graph';
/**
 * Service for handling log analysis using LangGraph
 */


export class VideoPipelineService {
  private readonly logger = new Logger(VideoPipelineService.name);
  private graph: VideoPipelineAssistantGraph;
  
  constructor(llm: BaseChatModel) {
    this.graph = new VideoPipelineAssistantGraph(llm);
  }
  
  /**
   * Process a user message and generate a response
   * @param chatId Chat ID for the conversation
   * @param userMessage Message from the user to process
   * @returns The assistant's response
   */
  async processMessage(chatId: string, userMessage: string): Promise<string> {
    try {
      // Initial state for the graph
      // const initialState: Partial<GraphState> = {
      //   messages: [{ role: "user", content: userMessage }],
      //   chatId
      // };

      const initialState: Partial<typeof StateAnnotation.State> = {
        message: userMessage,
      };

      console.log('initialState', initialState);
      
      // Execute the graph
      const result = await this.graph.invoke(initialState);
      console.log('result from graph', result);
      return result.message;
    } catch (error) {
      this.logger.error('Error processing message:', error);
      return "Sorry, I encountered an error processing your request.";
    }
  }
  
  /**
   * Stream a response to a user message
   * @param chatId Chat ID for the conversation
   * @param userMessage Message from the user to process
   * @returns An async generator that yields response chunks
   */
  async *streamResponse(chatId: string, userMessage: string): AsyncGenerator<string, void, unknown> {
    try {
      // Initial state for the graph
      const initialState: Partial<typeof StateAnnotation.State> = {
        message: userMessage,
      };
      
      // Stream the graph execution
      const stream = await this.graph.stream(initialState);
      let fullResponse = '';
      
      for await (const chunk of stream) {
        // Only yield assistant messages to the client
        if (chunk.message) {
          const latestMessage = chunk.message;
          if (latestMessage.length > fullResponse.length) {
            // Only stream the new part
            const newContent = latestMessage.substring(fullResponse.length);
            fullResponse = latestMessage;
            yield newContent;
          }
        }
      }
      
      if (!fullResponse) {
        yield "I couldn't process your request.";
      }
    } catch (error) {
      this.logger.error('Error streaming response:', error);
      yield "Sorry, I encountered an error processing your request.";
    }
  }
} 