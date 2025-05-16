import { RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { GraphState } from '../types/state';

export function createProposeNextStepNode(llm: ChatOpenAI) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", `Based on the log analysis, suggest meaningful next steps for the user.
    Possible suggestions might include:
    1. Refining the search with more specific filters
    2. Investigating specific error patterns
    3. Looking at related logs from other streams
    4. Drilling down into specific time periods
    5. Examining specific components or services
    
    Be specific and actionable in your suggestions.`],
    ["human", "Based on this analysis: {analysis}, what should I do next?"]
  ]);
  
  return RunnableLambda.from(async (state: GraphState) => {
    // Get the latest analysis from the assistant's last message
    const messages = state.messages || [];
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
    const analysis = lastAssistantMessage?.content || "No analysis available.";
    
    // Execute the prompt
    const formattedPrompt = await promptTemplate.formatPromptValue({ analysis });
    const response = await llm.invoke(formattedPrompt);
    const nextStepSuggestion = response.content?.toString() || "Would you like to refine your search?";
    
    return {
      messages: [...state.messages, { role: "assistant", content: nextStepSuggestion }]
    } as Partial<GraphState>;
  });
} 