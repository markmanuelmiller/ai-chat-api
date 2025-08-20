"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyzeLogsNode = createAnalyzeLogsNode;
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
function createAnalyzeLogsNode(llm) {
    const promptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
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
    return runnables_1.RunnableLambda.from(async (state) => {
        const logs = state.logs || [];
        const logsString = logs.join("\n");
        // Execute the analysis chain
        const formattedPrompt = await promptTemplate.formatPromptValue({ logs: logsString });
        const response = await llm.invoke(formattedPrompt);
        const analysis = response.content?.toString() || "No analysis available.";
        // Return state with the updated messages
        return {
            messages: [...state.messages, { role: "assistant", content: analysis }]
        };
    });
}
//# sourceMappingURL=analyze-logs.js.map