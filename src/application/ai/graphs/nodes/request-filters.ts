import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { GraphState } from '../types/state';

export function createRequestFiltersNode(llm: ChatOpenAI) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", "Extract filter criteria from the user's message. Return a JSON object with filter parameters like timestamp, severity, components, etc."],
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
      // Try to parse filter criteria from LLM output as JSON
      const content = output.content?.toString() || '{}';
      let filterCriteria = {};
      
      try {
        // Try to extract JSON object from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          filterCriteria = JSON.parse(jsonMatch[0]);
        } else {
          // Simple fallback parsing for key-value pairs
          const pairs: string[] = content.split(',').map((pair: string) => pair.trim());
          pairs.forEach((pair: string) => {
            const [key, value] = pair.split(':').map((item: string) => item.trim());
            if (key && value) {
              (filterCriteria as Record<string, string>)[key] = value;
            }
          });
        }
      } catch (error) {
        // If parsing fails, use a simple object
        filterCriteria = { raw: content };
      }
      
      return { filterCriteria } as Partial<GraphState>;
    })
  ]);
} 