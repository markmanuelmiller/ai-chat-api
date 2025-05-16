import { RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { GraphState } from '../types/state';

export function createProcessNextStepChoiceNode(llm: ChatOpenAI) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", `Determine if the user wants to refine their search or end the conversation.
    If they want to refine, return "refine".
    If they want to end or are satisfied, return "end".
    Only output one of these two words.`],
    ["human", "User message: {userMessage}"]
  ]);
  
  return RunnableLambda.from(async (state: GraphState) => {
    // Get the latest user message
    const messages = state.messages || [];
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    const userMessage = lastUserMessage?.content || "";
    
    if (!userMessage) {
      // If there's no user message, default to end
      return { nextStep: "end" } as Partial<GraphState>;
    }
    
    // Analyze the user's choice with the LLM
    const formattedPrompt = await promptTemplate.formatPromptValue({ userMessage });
    const response = await llm.invoke(formattedPrompt);
    const choice = response.content?.toString()?.toLowerCase().trim() || "";
    
    // Determine next step based on user's choice
    const nextStep = choice.includes("refine") ? "refine" : "end";
    
    return { nextStep } as Partial<GraphState>;
  });
} 