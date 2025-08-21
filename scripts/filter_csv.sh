#!/bin/bash

show_help() {
  echo "Usage: $(basename "$0") [OPTIONS] COMMAND"
  echo ""
  echo "Filter CSV data through a shell command using firejail for security."
  echo "Input CSV may contain mixed record types with common key columns."
  echo ""
  echo "Arguments:"
  echo "  COMMAND              Shell command to execute (e.g., 'grep \"xxx\" | awk \"{print \$1}\"')"
  echo ""
  echo "Options:"
  echo "  -h, --help           Show this help message and exit"
  echo "  -i FILE              Read input from FILE instead of stdin"
  echo "  -o FILE              Write output to FILE instead of stdout"
  echo "      --langchain-tool TOOLNAME PYTHON|NODE"
  echo "                       Output a LangChain tool descriptor for Python or Node.js with the given tool name and exit"
}

# Defaults
INPUT_FILE=""
OUTPUT_FILE=""
LANGCHAIN_TOOL_NAME=""
LANGCHAIN_TOOL_TARGET=""

# Parse options
while getopts ":hi:o:-:" opt; do
  case $opt in
    h)
      show_help
      exit 0
      ;;
    i)
      INPUT_FILE="$OPTARG"
      ;;
    o)
      OUTPUT_FILE="$OPTARG"
      ;;
    -)
      case "${OPTARG}" in
        help)
          show_help
          exit 0
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
def $LANGCHAIN_TOOL_NAME(command: str, input_file: Optional[str] = None, output_file: Optional[str] = None) -> str:
    """Process CSV data from binary logs using shell commands. The input CSV contains mixed record types where all records share the first 9 columns (timestamp, namespace, stream_key, etc.) but remaining columns vary by record type. Use this tool to filter, aggregate, or analyze the data with shell commands like grep, awk, cut, sort, uniq. IMPORTANT: When using awk or other commands that reference column variables like \$1, \$2, etc., you MUST escape the dollar sign with a backslash (\\). Example: 'grep \"rtpconsumer\" | awk -F, \"{print \\\\\\$1}\"' to get first column. For complex filtering: 'grep \"rtpproducer\" | grep \"video\" | awk -F, \"{print \\\\\\$10}\"'. Typically used after list_binlogs.sh and parse_binlogs.sh to analyze binary log data."""
    cmd = ['./filter_csv.sh']
    if input_file is not None:
        cmd += ['-i', input_file]
    if output_file is not None:
        cmd += ['-o', output_file]
    cmd.append(command)
    return subprocess.check_output(cmd, text=True)
EOF
    exit 0
  elif [[ "$LANGCHAIN_TOOL_TARGET" == "NODE" ]]; then
    cat <<EOF
const $LANGCHAIN_TOOL_NAME = tool(
  async ({ command, input_file, output_file }) => {
    const { z } = require("zod");
    const { execFileSync } = require('child_process');

    const args = [];
    if (input_file) args.push('-i', input_file);
    if (output_file) args.push('-o', output_file);
    args.push(command);
    return execFileSync('./filter_csv.sh', args, { encoding: 'utf8' });
  },
  {
    name: "$LANGCHAIN_TOOL_NAME",
    description: "Process CSV data from binary logs using shell commands. " +
                "The input CSV contains mixed record types where all records share the first 9 columns " +
                "(timestamp, namespace, stream_key, etc.) but remaining columns vary by record type. " +
                "Use this tool to filter, aggregate, or analyze the data with shell commands like grep, awk, cut, sort, uniq. " +
                "CRITICAL NOTE: the command is processed using /bin/bash -c \"(\$COMMAND)\". Make sure to properly escape it. " + 
                "for example escape awk \"{print \$1}\" as awk \"{print \\\$1}\"",
    schema: z.object({
      command: z.string().describe("Shell command to execute for filtering"),
      input_file: z.string().optional().describe("Input file path (reads from stdin if not provided)"),
      output_file: z.string().optional().describe("Output file path (writes to stdout if not provided)")
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

# Shift past the parsed options
shift $((OPTIND-1))

# Check if command is provided
if [[ $# -eq 0 ]]; then
  echo "Error: Command argument is required." >&2
  show_help
  exit 1
fi

COMMAND="$1"

# Validate firejail is available
if ! command -v firejail &> /dev/null; then
  echo "Error: firejail is required but not installed." >&2
  exit 1
fi

# Create temporary files for firejail operation
TEMP_DIR=$(mktemp -d)
TEMP_INPUT="$TEMP_DIR/input.csv"
TEMP_OUTPUT="$TEMP_DIR/output.csv"
TEMP_ERROR="$TEMP_DIR/error.log"
TEMP_STATUS="$TEMP_DIR/status.log"

# Cleanup function
cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Read input
if [[ -n "$INPUT_FILE" ]]; then
  if [[ ! -f "$INPUT_FILE" ]]; then
    echo "Error: Input file '$INPUT_FILE' not found." >&2
    exit 1
  fi
  cp "$INPUT_FILE" "$TEMP_INPUT"
else
  cat > "$TEMP_INPUT"
fi

# Execute command with firejail
FIREJAIL_CMD="firejail --quiet --noprofile --noroot --net=none \
  --private=$TEMP_DIR --private-dev --private-tmp --read-only=$TEMP_INPUT \
  --blacklist=/home --blacklist=/root --blacklist=/etc --blacklist=/usr \
  --blacklist=/var --blacklist=/opt --blacklist=/bin --blacklist=/sbin \
  --whitelist=$TEMP_OUTPUT \
  /bin/bash -c \"($COMMAND) < $TEMP_INPUT > $TEMP_OUTPUT 2> $TEMP_ERROR; echo \$? > $TEMP_STATUS\""

#echo "Executing: $FIREJAIL_CMD" >&2

firejail --quiet --noprofile --noroot --net=none --private="$TEMP_DIR" \
  --private-dev --private-tmp --read-only="$TEMP_INPUT" \
  --blacklist=/home --blacklist=/root --blacklist=/etc --blacklist=/usr \
  --blacklist=/var --blacklist=/opt --blacklist=/bin --blacklist=/sbin \
  --whitelist="$TEMP_OUTPUT" \
  /bin/bash -c "($COMMAND) < $TEMP_INPUT > $TEMP_OUTPUT 2> $TEMP_ERROR; echo \$? > $TEMP_STATUS"

# cat "$TEMP_ERROR" to stderr if it contains any errors
if [[ -s "$TEMP_ERROR" ]]; then
  echo "Errors during command execution" >&2
  echo "Command: ${FIREJAIL_CMD}" >&2
  cat "$TEMP_ERROR" >&2
  exit 1
fi

# if $TEMP_STATUS is not empty and it is not 0, print the error
if [[ -s "$TEMP_STATUS" ]]; then
  STATUS=$(cat "$TEMP_STATUS")
  if [[ "$STATUS" -ne 0 ]]; then
    echo "Command execution failed with status $STATUS" >&2
    echo "Command: ${FIREJAIL_CMD}" >&2
    echo "Check the error log for details: $TEMP_ERROR" >&2
    exit 1
  fi
fi

# Check if command succeeded
if [[ $? -ne 0 ]]; then
  echo "Error: Command execution failed." >&2
  exit 1
fi

# Write output
if [[ -n "$OUTPUT_FILE" ]]; then
  cp "$TEMP_OUTPUT" "$OUTPUT_FILE"
else
  cat "$TEMP_OUTPUT"
fi
