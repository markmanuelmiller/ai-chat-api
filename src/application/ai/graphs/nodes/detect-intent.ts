import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { GraphState, Intent } from '../types/state';

export function createDetectIntentNode(llm: ChatOpenAI) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", "Analyze the user's message and determine their intent. Particularly look for requests related to logs, filters, or searches."],
    ["human", "{userMessage}"]
  ]);
  
  return RunnableSequence.from([
    RunnableLambda.from((state: GraphState) => {
      const userMessage = state.messages[state.messages.length - 1].content;
      return { userMessage };
    }),
    promptTemplate,
    llm,
    RunnableLambda.from(async (output) => {
      const content = output.content?.toString() || '';
      let intent: Intent = { type: 'other' };
      
      if (content.toLowerCase().includes('filter') || content.toLowerCase().includes('search')) {
        intent = { type: 'request_filters' };
      } else if (content.toLowerCase().includes('stream') || content.toLowerCase().includes('log')) {
        intent = { type: 'extract_stream_name' };
      }
      
      return { intent } as Partial<GraphState>;
    })
  ]);
} 