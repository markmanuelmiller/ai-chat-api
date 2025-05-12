import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { GraphState } from '../types/state';

export function createAnalyzeLogsNode(llm: ChatOpenAI) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", `Analyze these logs and provide insights. Look for:
    1. Patterns or anomalies
    2. Error rates and severity distributions
    3. Potential correlations between events
    4. Noteworthy timestamps or time-based patterns
    5. Actionable information for the user
    
    Format your response clearly and concisely, focusing on useful insights rather than restating the logs.`],
    ["human", "Here are the logs to analyze:\n\n{logs}"]
  ]);
  
  // We need to capture state for later use with results
  return RunnableLambda.from(async (state: GraphState) => {
    const logs = state.logs || [];
    const logsString = logs.join("\n");
    
    // Execute the analysis chain
    const formattedPrompt = await promptTemplate.formatPromptValue({ logs: logsString });
    const response = await llm.invoke(formattedPrompt);
    const analysis = response.content?.toString() || "No analysis available.";
    
    // Return state with the updated messages
    return {
      messages: [...state.messages, { role: "assistant", content: analysis }]
    } as Partial<GraphState>;
  });
} 