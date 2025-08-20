"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandleToolErrorNode = createHandleToolErrorNode;
const runnables_1 = require("@langchain/core/runnables");
function createHandleToolErrorNode() {
    return runnables_1.RunnableLambda.from(async (state) => {
        const error = state.toolResult?.error || "Unknown error occurred while processing your request.";
        // Create a user-friendly error message
        const errorMessage = `I encountered an issue while retrieving logs: ${error}. Could you try refining your search with different parameters?`;
        return {
            messages: [...state.messages, { role: "assistant", content: errorMessage }]
        };
    });
}
//# sourceMappingURL=handle-tool-error.js.map