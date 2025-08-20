"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDetectIntentNode = createDetectIntentNode;
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
function createDetectIntentNode(llm) {
    const promptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
        ["system", "Analyze the user's message and determine their intent. Particularly look for requests related to logs, filters, or searches."],
        ["human", "{userMessage}"]
    ]);
    return runnables_1.RunnableSequence.from([
        runnables_1.RunnableLambda.from((state) => {
            const userMessage = state.messages[state.messages.length - 1].content;
            return { userMessage };
        }),
        promptTemplate,
        llm,
        runnables_1.RunnableLambda.from(async (output) => {
            const content = output.content?.toString() || '';
            let intent = { type: 'other' };
            if (content.toLowerCase().includes('filter') || content.toLowerCase().includes('search')) {
                intent = { type: 'request_filters' };
            }
            else if (content.toLowerCase().includes('stream') || content.toLowerCase().includes('log')) {
                intent = { type: 'extract_stream_name' };
            }
            return { intent };
        })
    ]);
}
//# sourceMappingURL=detect-intent.js.map