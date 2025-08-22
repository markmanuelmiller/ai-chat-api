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
exports.streamDoctorTools = exports.processData = exports.describeData = exports.convertBinaryToCsv = exports.listStatsFiles = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
// Get the scripts directory path
const getScriptsPath = () => {
    // In development, scripts are in the project root
    // In production, they might be in a different location
    const projectRoot = process.cwd();
    return path.join(projectRoot, 'scripts');
};
// List stats files tool
exports.listStatsFiles = (0, tools_1.tool)(async ({ m, c, n }) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, 'list_binlogs.sh');
    const args = [];
    if (m !== undefined)
        args.push('-m', String(m));
    if (c !== undefined)
        args.push('-c', String(c));
    if (n)
        args.push('-n', n);
    return (0, child_process_1.execFileSync)(scriptPath, args, { encoding: 'utf8' });
}, {
    name: "list-stats-files",
    description: "List all available stats files as a single line separated by spaces.",
    schema: zod_1.z.object({
        m: zod_1.z.number().optional().describe("Modified in last MINUTES"),
        c: zod_1.z.number().optional().describe("Changed in last MINUTES"),
        n: zod_1.z.string().optional().describe("Name pattern"),
    }),
});
// Convert binary to CSV tool
exports.convertBinaryToCsv = (0, tools_1.tool)(async ({ files }) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, 'parse_binlogs.sh');
    const options = { encoding: 'utf8' };
    if (files) {
        options.input = files;
    }
    return (0, child_process_1.execFileSync)(scriptPath, [], options);
}, {
    name: "convert-binary-to-csv",
    description: "Takes a list of stats files (the output of list-stats-files), converts each file from its current format to CSV, " +
        "and returns the combined output from all files. If files is provided, it should be a space-separated string of file paths. " +
        "If not provided, will read from stdin.",
    schema: zod_1.z.object({
        files: zod_1.z.string().optional().describe("Space-separated list of file paths to parse")
    }),
});
// Describe data tool
exports.describeData = (0, tools_1.tool)(async ({ record_types, json_output }) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, 'describe_records.sh');
    const args = [];
    if (record_types)
        args.push('-t', record_types);
    if (json_output)
        args.push('-j');
    return (0, child_process_1.execFileSync)(scriptPath, args, { encoding: 'utf8' });
}, {
    name: "describe-data",
    description: "Describe the structure of binary log records and their columns. " +
        "- If 'record_types' is a comma-separated list (e.g., 'rtpproducer,rtpconsumer'), returns the description of those types as JSON. " +
        "- If 'record_types' is not set, returns just the list of available record types as JSON. " +
        "Set 'json_output' to true for JSON output. " +
        "All records share the first 9 columns: timestamp, namespace, stream_key, session_id, " +
        "participant_id, track_id, record_type, sequence_number, data_size. " +
        "Remaining columns vary by record_type (rtpproducer, rtpconsumer, webrtctransport, etc.). " +
        "Use this to understand the data structure before filtering with shell commands.",
    schema: zod_1.z.object({
        record_types: zod_1.z.string().optional().describe("Comma-separated list of record types to describe (e.g., 'rtpproducer,rtpconsumer'). If not set, returns only the list of available record types."),
        json_output: zod_1.z.boolean().optional().describe("Output in JSON format instead of human-readable text")
    }),
});
// Process data tool
exports.processData = (0, tools_1.tool)(async ({ command }) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, 'filter_csv.sh');
    return (0, child_process_1.execFileSync)(scriptPath, [command], { encoding: 'utf8' });
}, {
    name: "process-data",
    description: "Execute shell commands to analyze and filter CSV data from previous steps. " +
        "Supports standard Unix utilities like grep, awk, sort, cut, uniq, and pipes for complex data processing. " +
        "Commands are executed via /bin/bash -c with the CSV data as input.",
    schema: zod_1.z.object({
        command: zod_1.z.string().describe("Shell command to process the data. Use standard Unix tools and pipes. " +
            "Examples: 'grep \"rtpproducer\" | wc -l', 'awk -F\",\" \"{sum+=\\$5} END {print sum}\"', 'sort -t\",\" -k2'"),
    }),
});
// Export all tools
exports.streamDoctorTools = [exports.listStatsFiles, exports.convertBinaryToCsv, exports.describeData, exports.processData];
//# sourceMappingURL=stream-doctor-tools.js.map