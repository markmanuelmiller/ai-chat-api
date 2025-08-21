"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMetaDataOnly = isMetaDataOnly;
exports.getData = getData;
exports.getMetaData = getMetaData;
exports.analyzeData = analyzeData;
exports.response = response;
exports.shouldEnd = shouldEnd;
const prompts_1 = require("@langchain/core/prompts");
const messages_1 = require("@langchain/core/messages");
const zod_1 = require("zod");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const stream_doctor_tools_1 = require("../tools/stream-doctor-tools");
// Get the scripts directory path
const getScriptsPath = () => {
    const projectRoot = process.cwd();
    return path.join(projectRoot, 'scripts');
};
// Schema for metadata-only classification
const isMetaDataOnlySchema = zod_1.z.object({
    requiresData: zod_1.z
        .boolean()
        .describe("Indicates if the query requires actual data and not just metadata"),
});
// Schema for record type selection
const selectRecordTypeSchema = zod_1.z.object({
    recordTypes: zod_1.z
        .array(zod_1.z.string())
        .describe("array of specific record type names to filter and analyze - names must match exactly as they appear in the describe-data tool output"),
});
// Prompts
const isMetaDataOnlySchemaPrompt = prompts_1.ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a classification agent that determines whether a user's query about stats data can be answered 
    using only meta-data (such as record types, field names, and descriptions), or if it requires access to 
    the actual stats records (the data itself).

Your task:
- Analyze the user's prompt.
- If the question can be answered using only the schema, structure, or descriptions of the data (e.g., "What 
  fields are available?", "Describe the record types", "What does the 'timestamp' field mean?"), set requiresData to false.
- If the question requires looking at the actual values or statistics from the records (e.g., "How many records 
  are there?", "What is the average bitrate?", "Show me the top 10 sessions"), set requiresData to true.

Be strict: Only set requiresData to false if the query is clearly about meta-data or schema, not about the actual data values.

CONVERSATION CONTEXT:
{conversationHistory}`
    ],
    ["human", "{prompt}"]
]);
const metaDataOnlyQueryPrompt = prompts_1.ChatPromptTemplate.fromTemplate(`
You are a meta-data analysis agent. You will receive three inputs:
- A user's prompt containing a query about the meta-data.
- The complete meta-data as a JSON object, describing all supported record types, their descriptions, and their fields.
- The conversation history for context.

Your task:
- Answer the user's query using ONLY the provided meta-data JSON.
- Consider the conversation history for context and continuity.
- Respond clearly and concisely, referencing only information present in the meta-data JSON.
- Do not use any external knowledge or assumptions—base your answer strictly on the provided JSON.

Inputs:
USER PROMPT:
{prompt}

CONVERSATION HISTORY:
{conversationHistory}

META DATA JSON:
{metaData}
`);
const listFilesStepPrompt = prompts_1.ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a time range analysis agent that processes user queries to determine the appropriate temporal filters for stats files.

Your primary task is to:
1. Analyze the user's query to identify any temporal requirements
2. Convert natural language time expressions into formal parameters for the list-stats-files tool
3. Call the list-stats-files tool with the appropriate time arguments

TIME RANGE MAPPING:
- "last hour" / "past hour" → -m 60
- "last 2 hours" / "past 2 hours" → -m 120
- "last day" / "past 24 hours" / "today" → -m 1440
- "last week" / "past week" → -m 10080
- "recently" / "recent" → -m 60 (default to last hour)
- No time specification → no time filter (all files)

TOOL PARAMETERS:
The list-stats-files tool passes parameters directly to the Linux find command:
- m: Modified in last MINUTES → passed as -mmin value to find command
- c: Changed in last MINUTES → passed as -cmin value to find command

The underlying find command uses:
- -mmin N: files modified N minutes ago
- -cmin N: files with status changed N minutes ago

EXAMPLES:
- "files from the last hour" → list-stats-files with m=60 → find -mmin 60
- "data from the past 2 hours" → list-stats-files with m=120 → find -mmin 120
- "recent files" → list-stats-files with m=60 → find -mmin 60
- "files changed recently" → list-stats-files with c=60 → find -cmin 60
- "how many records total" (no time specified) → list-stats-files with no parameters → find without filters

IMPORTANT:
- Always call the list-stats-files tool as your response
- Use only the time parameters that are relevant to the user's query
- If no time range is specified, call list-stats-files without time parameters
- Convert all time expressions to minutes for the -m parameter (maps to find -mmin)
- Use -c parameter when query refers to file changes (maps to find -cmin)
- Be precise with parameter mapping - don't guess or approximate

CONVERSATION CONTEXT:
{conversationHistory}`
    ],
    ["human", "{prompt}"]
]);
const selectRecordTypePrompt = prompts_1.ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a precise classification agent that selects relevant record types for analysis based on the user's query and the available record types.

INPUTS:
- The user's query (natural language question or task).
- The complete list of available record types, as output by the describe-data tool. Each record type is listed by name, followed by a description.
- The conversation history for context.

YOUR TASK:
- Carefully read the user's query and the list of record types.
- Consider the conversation history for context and continuity.
- Identify which record types are relevant to the user's query.
- Return ONLY the names of the relevant record types, as an array of strings, matching exactly the names as they appear in the describe-data tool output (e.g., "rtpproducer", "rtpconsumer", "encaudio").
- If the query is ambiguous or refers to all data, return all record type names.
- If the query refers to a specific type (e.g., "rtpproducer"), return only that type.
- If the query refers to multiple types (e.g., "audio streams"), return all matching types (e.g., "encaudio", "rawaudio").
- Do not guess or hallucinate record types that are not present in the provided list.
- Do not include descriptions or explanations in your output—only the array of record type names.

EXAMPLES:
- Query: "How many RTP producers?" → Output: ["rtpproducer"]
- Query: "Show me all audio streams" → Output: ["encaudio", "rawaudio"]
- Query: "Total records" → Output: [all record type names]
- Query: "egress statistics" → Output: ["egressbilling"]

CONVERSATION CONTEXT:
{conversationHistory}

If you are unsure, include all possible relevant types. Be strict about matching names exactly as listed.

You will receive the user's query and the list of record types in the conversation history.`
    ],
    ["human", "{recordTypes}"],
    ["human", "{prompt}"]
]);
const dataAnalyzerPrompt = prompts_1.ChatPromptTemplate.fromTemplate(`
You are a data analysis agent. Your ONLY valid response is to call the process-data tool with a shell command that answers the user's objective using the provided CSV data.

Instructions:
- The input CSV data contains only relevant record types.
- Use standard Linux commands (grep, awk, cut, sort, uniq, wc, etc.) to compose the shell command.
- The shell command must answer the user's query based on the CSV data and field descriptions.
- Consider the conversation history for context and continuity.
- DO NOT output the command directly. DO NOT provide explanations or any other text.
- If the query cannot be answered, you will return an error message without making any tool calls.

Examples:
- To count records per jobId and sort: call process-data with command: cut -d, -f4 | sort | uniq -c | sort -n -k1
- To count unique session IDs: call process-data with command: cut -d, -f4 | sort | uniq | wc -l
- To average data_size per record_type: call process-data with command: awk -F',' '{{a[$7]+=$9; c[$7]++}} END {{for (k in a) print k, a[k]/c[k]}}'

CONVERSATION CONTEXT:
{conversationHistory}

ALWAYS respond by calling the process-data tool with the appropriate command.

META DATA:
{metaData}

SAMPLE INPUT DATA:
{sampleData}

OBJECTIVE:
{prompt}
`);
const generateResponsePrompt = prompts_1.ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a helpful assistant. Respond in a clear, professional, and concise manner.

If an error occurred, summarize the error message for the user.
If the operation was successful, provide the final result.

Always include either the error message or the final result, depending on the situation. Do not include both unless both are relevant.`
    ],
    ["human", "{prompt}"],
    ["human", "Error: {error}"],
    ["human", "Result: {finalResult}"]
]);
// Node functions
async function isMetaDataOnly(state, llm) {
    console.log('DEBUG: isMetaDataOnly called with state:', {
        input: state.input,
        conversationHistoryLength: state.conversationHistory?.length || 0,
        sessionId: state.sessionId
    });
    let metaDataContent;
    try {
        const scriptsPath = getScriptsPath();
        const typeJsonPath = path.join(scriptsPath, 'type.json');
        metaDataContent = fs.readFileSync(typeJsonPath, 'utf8');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            error: `Failed to read or process type.json: ${errorMessage}`,
        };
    }
    try {
        const isMetaDataOnlySchemaModel = llm.withStructuredOutput(isMetaDataOnlySchema);
        const isMetaDataOnlyTester = isMetaDataOnlySchemaPrompt.pipe(isMetaDataOnlySchemaModel);
        const result = await isMetaDataOnlyTester.invoke({
            prompt: state.input,
            conversationHistory: (state.conversationHistory || []).length > 0 ? JSON.stringify(state.conversationHistory) : "No previous conversation history."
        });
        if (result?.requiresData) {
            return {};
        }
        const conversationHistory = state.conversationHistory || [];
        const messages = await metaDataOnlyQueryPrompt.formatMessages({
            prompt: state.input,
            metaData: metaDataContent,
            conversationHistory: conversationHistory.length > 0 ? JSON.stringify(conversationHistory) : "No previous conversation history."
        });
        const response = await llm.invoke(messages);
        return {
            finalResult: typeof response?.content === 'string' ? response.content : JSON.stringify(response?.content) || "",
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            error: `Failed to determine if metadata only: ${errorMessage}`,
        };
    }
}
async function getData(state, llm) {
    const llmWithTools = llm.bindTools?.(stream_doctor_tools_1.streamDoctorTools) || llm;
    let messages = await listFilesStepPrompt.formatMessages({
        prompt: state.input,
        conversationHistory: (state.conversationHistory || []).length > 0 ? JSON.stringify(state.conversationHistory) : "No previous conversation history."
    });
    const msg = await llmWithTools.invoke(messages);
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return {
            error: "list files step did not return any tool calls",
        };
    }
    if (msg.tool_calls.length > 1) {
        return {
            error: "list files step returned multiple tool calls, expected only one",
        };
    }
    let toolCall = msg.tool_calls[0];
    if (toolCall.name !== 'list-stats-files') {
        return {
            error: "list-stats-files tool was not called, but it is required for this step",
        };
    }
    let toolsHistory = state.toolsHistory || [];
    let result;
    try {
        const { listStatsFiles } = await import('../tools/stream-doctor-tools.js');
        result = await listStatsFiles.invoke(toolCall.args);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            error: `Failed to list stats files: ${errorMessage}`,
        };
    }
    if (!result || result.trim() === '') {
        return {
            error: "No stats files found",
        };
    }
    try {
        const scriptsPath = getScriptsPath();
        const parseScriptPath = path.join(scriptsPath, 'parse_binlogs.sh');
        result = await (0, child_process_1.execFileSync)(parseScriptPath, [], { encoding: 'utf8', input: result });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            error: `Failed to convert binary logs to CSV: ${errorMessage}`,
        };
    }
    if (!result || result.trim() === '') {
        return {
            error: "No CSV data generated from stats files",
        };
    }
    toolsHistory.push({
        toolName: 'convert-binary-to-csv',
        output: result,
    });
    return {
        toolsHistory,
    };
}
async function getMetaData(state, llm) {
    let result;
    try {
        const scriptsPath = getScriptsPath();
        const describeScriptPath = path.join(scriptsPath, 'describe_records.sh');
        result = await (0, child_process_1.execFileSync)(describeScriptPath, [], { encoding: 'utf8' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            error: `Failed to describe records: ${errorMessage}`,
        };
    }
    if (!result || result.trim() === '') {
        return {
            error: "No record types found",
        };
    }
    const selectRecordTypesModel = llm.withStructuredOutput(selectRecordTypeSchema);
    const recordTypesSelector = selectRecordTypePrompt.pipe(selectRecordTypesModel);
    result = await recordTypesSelector.invoke({
        prompt: state.input,
        recordTypes: result,
        conversationHistory: (state.conversationHistory || []).length > 0 ? JSON.stringify(state.conversationHistory) : "No previous conversation history."
    });
    if (!result || !result.recordTypes?.length) {
        return {
            error: `Records types selector did not return any record types for the input: ${state.input} result: ${result}`,
        };
    }
    let toolsHistory = state.toolsHistory || [];
    let recordTypes = result.recordTypes.join(',');
    toolsHistory.push({
        toolName: 'record-types',
        output: recordTypes,
    });
    try {
        const { describeData } = await import('../tools/stream-doctor-tools.js');
        result = await describeData.invoke({
            record_types: recordTypes,
            json_output: true
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            error: `Failed to describe record types: ${errorMessage}`,
        };
    }
    if (!result || result.trim() === '') {
        return {
            error: "No record type descriptions found",
        };
    }
    toolsHistory.push({
        toolName: 'describe-data',
        output: result,
    });
    return {
        toolsHistory,
    };
}
function generateAwkFilterRecordsExpression(values) {
    const conditions = values.flatMap(value => [
        `$2=="${value}"`,
        `$2=="\\"${value}\\""`,
    ]);
    return `awk -F, '${conditions.join("||")}'`;
}
async function analyzeData(state, llm) {
    let csvData = state.toolsHistory.find(t => t.toolName === 'convert-binary-to-csv')?.output || "";
    let recordTypes = state.toolsHistory.find(t => t.toolName === 'record-types')?.output || "";
    if (recordTypes && recordTypes.trim() !== '') {
        try {
            const scriptsPath = getScriptsPath();
            const filterScriptPath = path.join(scriptsPath, 'filter_csv.sh');
            let result = await (0, child_process_1.execFileSync)(filterScriptPath, [generateAwkFilterRecordsExpression(recordTypes.split(','))], { encoding: 'utf8', input: csvData });
            if (result && result.trim() !== '') {
                csvData = result;
            }
            else {
                return {
                    error: `No data found for the specified record types: ${recordTypes}`,
                };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                error: `Failed to filter CSV data by record types: ${errorMessage}`,
            };
        }
    }
    // Generate a random sample of up to 100 lines from csvData
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    let sampleData;
    if (lines.length <= 100) {
        sampleData = csvData;
    }
    else {
        const shuffled = [...lines].sort(() => Math.random() - 0.5);
        sampleData = shuffled.slice(0, 100).join('\n');
    }
    let metaData = state.toolsHistory.find(t => t.toolName === 'describe-data')?.output || "";
    let messages = await dataAnalyzerPrompt.formatMessages({
        metaData: `\nmeta-data:\n ${metaData}`,
        sampleData: `\nsample-data:\n ${sampleData}`,
        prompt: `\nuser-query:\n ${state.input}`,
        conversationHistory: (state.conversationHistory || []).length > 0 ? JSON.stringify(state.conversationHistory) : "No previous conversation history."
    });
    let result;
    const llmWithTools = llm.bindTools?.(stream_doctor_tools_1.streamDoctorTools) || llm;
    for (let i = 0; i < 10; i++) {
        const msg = await llmWithTools.invoke(messages);
        if (!msg.tool_calls || msg.tool_calls.length === 0) {
            if (i > 0) {
                return {
                    finalResult: result,
                };
            }
            return {
                error: "data analysis step did not return any tool calls",
            };
        }
        if (msg.tool_calls.length > 1) {
            return {
                error: "data analysis step returned multiple tool calls, expected only one",
            };
        }
        let toolCall = msg.tool_calls[0];
        if (toolCall.name !== 'process-data') {
            return {
                error: `process-data tool was not called, but it is required for this step. tool_calls: ${JSON.stringify(msg.tool_calls)}`,
            };
        }
        try {
            const scriptsPath = getScriptsPath();
            const filterScriptPath = path.join(scriptsPath, 'filter_csv.sh');
            result = await (0, child_process_1.execFileSync)(filterScriptPath, [toolCall.args.command], { encoding: 'utf8', input: csvData });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                error: `Failed to analyze data: ${errorMessage}`,
            };
        }
        messages.push(new messages_1.AIMessage({
            content: msg.content,
            tool_calls: msg.tool_calls
        }));
        messages.push(new messages_1.ToolMessage({
            content: result,
            tool_call_id: toolCall.id || ""
        }));
        messages.push(new messages_1.HumanMessage({
            content: "Please review the tool response above. If the output correctly answers the user's query and appears accurate, respond without making any additional tool calls. If the result seems incorrect, incomplete, or doesn't address the user's question, generate a new process-data tool call with a refined command."
        }));
    }
    return {};
}
async function response(state, llm) {
    const prompt = state.input || "";
    let error = state.error || "";
    let finalResult = state.finalResult || "";
    // If error, indicate in finalResult; if not, clear error
    if (error) {
        error = "ERROR: " + error;
        finalResult = "FINAL RESULT: An error occurred. See error message.";
    }
    else if (finalResult) {
        error = "ERROR: no errors Success !!!";
        finalResult = "FINAL RESULT: " + finalResult;
    }
    else {
        finalResult = "FINAL RESULT: hmm no errors and no result";
        error = "ERROR: no errors";
    }
    const messages = await generateResponsePrompt.formatMessages({
        prompt,
        error,
        finalResult,
    });
    // Call the LLM and get the result
    const llmResponse = await llm.invoke(messages);
    const responseContent = llmResponse && llmResponse.content ?
        (typeof llmResponse.content === 'string' ? llmResponse.content : JSON.stringify(llmResponse.content)) :
        "No response generated.";
    // Add to conversation history
    const conversationHistory = state.conversationHistory || [];
    conversationHistory.push({ role: "user", content: prompt });
    conversationHistory.push({
        role: "assistant",
        content: responseContent
    });
    return {
        conversationHistory,
        finalResult: responseContent,
        streamingMessages: [responseContent],
    };
}
function shouldEnd(state) {
    return state.error || state.finalResult ? "true" : "false";
}
//# sourceMappingURL=stream-doctor-nodes.js.map