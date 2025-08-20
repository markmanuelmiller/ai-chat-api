"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProcessNextStepChoiceNode = createProcessNextStepChoiceNode;
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
function createProcessNextStepChoiceNode(llm) {
    const promptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
        ["system", `Determine if the user wants to refine their search or end the conversation.
    If they want to refine, return "refine".
    If they want to end or are satisfied, return "end".
    Only output one of these two words.`],
        ["human", "User message: {userMessage}"]
    ]);
    return runnables_1.RunnableLambda.from(async (state) => {
        // Get the latest user message
        const messages = state.messages || [];
        const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
        const userMessage = lastUserMessage?.content || "";
        if (!userMessage) {
            // If there's no user message, default to end
            return { nextStep: "end" };
        }
        // Analyze the user's choice with the LLM
        const formattedPrompt = await promptTemplate.formatPromptValue({ userMessage });
        const response = await llm.invoke(formattedPrompt);
        const choice = response.content?.toString()?.toLowerCase().trim() || "";
        // Determine next step based on user's choice
        const nextStep = choice.includes("refine") ? "refine" : "end";
        return { nextStep };
    });
}
//# sourceMappingURL=process-next-step-choice.js.map