"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestFiltersNode = createRequestFiltersNode;
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
function createRequestFiltersNode(llm) {
    const promptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
        ["system", "Extract filter criteria from the user's message. Return a JSON object with filter parameters like timestamp, severity, components, etc."],
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
            // Try to parse filter criteria from LLM output as JSON
            const content = output.content?.toString() || '{}';
            let filterCriteria = {};
            try {
                // Try to extract JSON object from the content
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    filterCriteria = JSON.parse(jsonMatch[0]);
                }
                else {
                    // Simple fallback parsing for key-value pairs
                    const pairs = content.split(',').map((pair) => pair.trim());
                    pairs.forEach((pair) => {
                        const [key, value] = pair.split(':').map((item) => item.trim());
                        if (key && value) {
                            filterCriteria[key] = value;
                        }
                    });
                }
            }
            catch (error) {
                // If parsing fails, use a simple object
                filterCriteria = { raw: content };
            }
            return { filterCriteria };
        })
    ]);
}
//# sourceMappingURL=request-filters.js.map