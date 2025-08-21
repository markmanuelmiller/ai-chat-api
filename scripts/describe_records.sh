#!/bin/bash

show_help() {
  echo "Usage: $(basename "$0") [OPTIONS]"
  echo ""
  echo "Describe the structure of binary log records and their CSV columns."
  echo "Uses the type.json file to provide detailed information about record types and fields."
  echo ""
  echo "Options:"
  echo "  -h, --help           Show this help message and exit"
  echo "  -t TYPES             Comma-separated list of record types to describe (e.g., 'rtpproducer,rtpconsumer')."
  echo "                       If not set, returns only the list of available record types."
  echo "  -j, --json           Output in JSON format"
  echo "      --langchain-tool TOOLNAME PYTHON|NODE"
  echo "                       Output a LangChain tool descriptor for Python or Node.js with the given tool name and exit"
}

# Defaults
RECORD_TYPES=""
JSON_OUTPUT=false
LANGCHAIN_TOOL_NAME=""
LANGCHAIN_TOOL_TARGET=""

# Parse options
while getopts ":ht:j-:" opt; do
  case $opt in
    h)
      show_help
      exit 0
      ;;
    t)
      RECORD_TYPES="$OPTARG"
      ;;
    j)
      JSON_OUTPUT=true
      ;;
    -)
      case "${OPTARG}" in
        help)
          show_help
          exit 0
          ;;
        json)
          JSON_OUTPUT=true
          ;;
        langchain-tool)
          LANGCHAIN_TOOL_NAME="${!OPTIND}"; OPTIND=$((OPTIND+1))
          LANGCHAIN_TOOL_TARGET="${!OPTIND}"; OPTIND=$((OPTIND+1))
          ;;
        *)
          echo "Unknown option --${OPTARG}" >&2
          exit 1
          ;;
      esac
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

if [[ -n "$LANGCHAIN_TOOL_NAME" && -n "$LANGCHAIN_TOOL_TARGET" ]]; then
  if [[ "$LANGCHAIN_TOOL_TARGET" == "PYTHON" ]]; then
    cat <<EOF
import subprocess
from langchain_core.tools import tool
from typing import Optional

@tool
def $LANGCHAIN_TOOL_NAME(record_types: Optional[str] = None, json_output: Optional[bool] = False) -> str:
    """Describe the structure of binary log records and their CSV columns.
    - If 'record_types' is a comma-separated list (e.g., 'rtpproducer,rtpconsumer'), returns the description of those types as JSON.
    - If 'record_types' is not set, returns just the list of available record types as JSON.
    - Set 'json_output' to True for JSON output.
    All records share the first 9 columns: timestamp, namespace, stream_key, session_id,
    participant_id, track_id, record_type, sequence_number, data_size.
    Remaining columns vary by record_type (rtpproducer, rtpconsumer, webrtctransport, etc.).
    Use this to understand the data structure before filtering with shell commands."""
    cmd = ['./describe_records.sh']
    if record_types is not None:
        cmd += ['-t', record_types]
    if json_output:
        cmd += ['-j']
    return subprocess.check_output(cmd, text=True)
EOF
    exit 0
  elif [[ "$LANGCHAIN_TOOL_TARGET" == "NODE" ]]; then
    cat <<EOF
const $LANGCHAIN_TOOL_NAME = tool(
  async ({ record_types, json_output }) => {
    const { z } = require("zod");
    const { execFileSync } = require('child_process');

    const args = [];
    if (record_types) args.push('-t', record_types);
    if (json_output) args.push('-j');
    return execFileSync('./describe_records.sh', args, { encoding: 'utf8' });
  },
  {
    name: "$LANGCHAIN_TOOL_NAME",
    description: "Describe the structure of binary log records and their CSV columns. " +
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
EOF
    exit 0
  else
    echo "Unknown value for --langchain-tool target: $LANGCHAIN_TOOL_TARGET" >&2
    exit 1
  fi
fi

# Find the type.json file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TYPE_JSON_FILE="$SCRIPT_DIR/type.json"

if [[ ! -f "$TYPE_JSON_FILE" ]]; then
  echo "Error: type.json file not found at $TYPE_JSON_FILE" >&2
  exit 1
fi

# Check if jq is available for JSON processing
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed." >&2
  exit 1
fi

# Common columns shared by all record types
COMMON_COLUMNS="timestamp,namespace,stream_key,session_id,participant_id,track_id,record_type,sequence_number,data_size"

if [[ "$JSON_OUTPUT" == true ]]; then
  if [[ -n "$RECORD_TYPES" ]]; then
    # Output only the specified record types as JSON (full descriptor)
    IFS=',' read -ra TYPES_ARR <<< "$RECORD_TYPES"
    JQ_FILTER='{'
    for i in "${!TYPES_ARR[@]}"; do
      TYPE="${TYPES_ARR[$i]}"
      if [[ $i -ne 0 ]]; then
        JQ_FILTER+=','
      fi
      JQ_FILTER+="\"$TYPE\": .[\"$TYPE\"]"
    done
    JQ_FILTER+='}'
    jq "$JQ_FILTER" "$TYPE_JSON_FILE"
  else
    # Output all record types with modules and description as JSON
    jq 'to_entries | map({type: .key, modules: .value.modules, description: .value.description})' "$TYPE_JSON_FILE"
  fi
else
  echo "Binary Log CSV Record Structure:"
  echo "================================"
  echo ""
  echo "Common Columns (positions 1-9, shared by all record types):"
  echo "  1. timestamp      - Unix timestamp in microseconds"
  echo "  2. namespace      - Namespace identifier"
  echo "  3. stream_key     - Stream key identifier"
  echo "  4. session_id     - Session identifier"
  echo "  5. participant_id - Participant identifier"
  echo "  6. track_id       - Track identifier"
  echo "  7. record_type    - Type of record (determines remaining columns)"
  echo "  8. sequence_number- Sequence number"
  echo "  9. data_size      - Size of the data in bytes"
  echo ""
  
  if [[ -n "$RECORD_TYPES" ]]; then
    IFS=',' read -ra TYPES_ARR <<< "$RECORD_TYPES"
    for TYPE in "${TYPES_ARR[@]}"; do
      TYPE_OBJ=$(jq -r --arg type "$TYPE" '.[$type] // empty' "$TYPE_JSON_FILE")
      if [[ -n "$TYPE_OBJ" && "$TYPE_OBJ" != "null" ]]; then
        MODULES=$(echo "$TYPE_OBJ" | jq -r '.modules | join(", ")')
        DESC=$(echo "$TYPE_OBJ" | jq -r '.description')
        echo "Record Type: $TYPE"
        echo "  Modules: $MODULES"
        echo "  Description: $DESC"
        echo "Additional Columns (positions 10+):"
        echo "$TYPE_OBJ" | jq -r '.fields | to_entries[] | "  \(.key): \(.value)"' 2>/dev/null
        echo ""
      else
        echo "Record type '$TYPE' not found."
        echo ""
      fi
    done
    echo "Available record types:"
    jq -r 'to_entries[] | "\(.key): modules=[" + (.value.modules | join(", ")) + "] - " + .value.description' "$TYPE_JSON_FILE"
  else
    # Output all record types with modules and description in plain text
    jq -r 'to_entries[] | "\(.key): modules=[" + (.value.modules | join(", ")) + "] - " + .value.description' "$TYPE_JSON_FILE"
  fi
fi
