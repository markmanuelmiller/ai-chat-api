import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/utils/logger';

// Get the scripts directory path
const getScriptsPath = () => {
  // In development, scripts are in the project root
  // In production, they might be in a different location
  const projectRoot = process.cwd();
  return path.join(projectRoot, 'scripts');
};

// List stats files tool
export const listStatsFiles = tool(
  async ({ m, c, n }) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, 'list_binlogs.sh');
    
    // Debug: Log working directory and script path
    logger.info('Current working directory:', process.cwd());
    logger.info('Scripts path:', scriptsPath);
    logger.info('Full script path:', scriptPath);
    logger.info('Script exists:', fs.existsSync(scriptPath));
    
    const args: string[] = [];
    // if (m !== undefined) args.push('-m', String(m));
    // if (c !== undefined) args.push('-c', String(c));
    // if (n) args.push('-n', n);

    // Debug: Log arguments
    logger.info('list_binlogs.sh Arguments xxx:', args);
    
    const options: any = { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    };
    
    return execFileSync(scriptPath, args, options);
  },
  {
    name: "list-stats-files",
    description: "List all available stats files as a single line separated by spaces.",
    schema: z.object({
      m: z.number().optional().describe("Modified in last MINUTES"),
      c: z.number().optional().describe("Changed in last MINUTES"),
      n: z.string().optional().describe("Name pattern"),
    }),
  }
);

// Convert binary to CSV tool
export const convertBinaryToCsv = tool(
  async ({ files }) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, 'parse_binlogs.sh');
    
    const options: any = { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    };
    if (files) {
      options.input = files;
    }

    logger.info('parse_binlogs.sh Arguments: xxx', options);
    
    return execFileSync(scriptPath, [], options);
  },
  {
    name: "convert-binary-to-csv",
    description: "Takes a list of stats files (the output of list-stats-files), converts each file from its current format to CSV, " +
      "and returns the combined output from all files. If files is provided, it should be a space-separated string of file paths. " +
      "If not provided, will read from stdin.",
    schema: z.object({
      files: z.string().optional().describe("Space-separated list of file paths to parse")
    }),
  }
);



// Describe data tool
export const describeData = tool(
  async ({ record_types, json_output }) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, 'describe_records.sh');
    
    const args: string[] = [];
    if (record_types) args.push('-t', record_types);
    if (json_output) args.push('-j');

    logger.info('describe_records.sh Arguments:', args);
    
    const options: any = { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    };
    
    return execFileSync(scriptPath, args, options);
  },
  {
    name: "describe-data",
    description: "Describe the structure of binary log records and their columns. " +
      "- If 'record_types' is a comma-separated list (e.g., 'rtpproducer,rtpconsumer'), returns the description of those types as JSON. " +
      "- If 'record_types' is not set, returns just the list of available record types as JSON. " +
      "Set 'json_output' to true for JSON output. " +
      "All records share the first 9 columns: timestamp, namespace, stream_key, session_id, " +
      "participant_id, track_id, record_type, sequence_number, data_size. " +
      "Remaining columns vary by record_type (rtpproducer, rtpconsumer, webrtctransport, etc.). " +
      "Use this to understand the data structure before filtering with shell commands.",
    schema: z.object({
      record_types: z.string().optional().describe("Comma-separated list of record types to describe (e.g., 'rtpproducer,rtpconsumer'). If not set, returns only the list of available record types."),
      json_output: z.boolean().optional().describe("Output in JSON format instead of human-readable text")
    }),
  }
);

// Process data tool
export const processData = tool(
  async ({ command }) => {
    const scriptsPath = getScriptsPath();
    const scriptPath = path.join(scriptsPath, 'filter_csv.sh');

    logger.info('filter_csv.sh Arguments:', [command]);
    
    const options: any = { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    };
    
    return execFileSync(scriptPath, [command], options);
  },
  {
    name: "process-data",
    description: "Execute shell commands to analyze and filter CSV data from previous steps. " +
      "Supports standard Unix utilities like grep, awk, sort, cut, uniq, and pipes for complex data processing. " +
      "Commands are executed via /bin/bash -c with the CSV data as input.",
    schema: z.object({
      command: z.string().describe(
        "Shell command to process the data. Use standard Unix tools and pipes. " +
        "Examples: 'grep \"rtpproducer\" | wc -l', 'awk -F\",\" \"{sum+=\\$5} END {print sum}\"', 'sort -t\",\" -k2'"
      ),
    }),
  }
);

// Export all tools
export const streamDoctorTools = [listStatsFiles, convertBinaryToCsv, describeData, processData];
