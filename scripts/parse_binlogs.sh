#!/bin/bash

show_help() {
  echo "Usage: $(basename "$0") [OPTIONS] [FILES...]"
  echo ""
  echo "Parse binary log files using blcli and output combined CSV results."
  echo "If no FILES are provided, reads space-separated file paths from stdin."
  echo ""
  echo "Options:"
  echo "  -h, --help           Show this help message and exit"
  echo "      --langchain-tool TOOLNAME PYTHON|NODE"
  echo "                       Output a LangChain tool descriptor for Python or Node.js with the given tool name and exit"
}

# Defaults
LANGCHAIN_TOOL_NAME=""
LANGCHAIN_TOOL_TARGET=""

# Parse options
while getopts ":h-:" opt; do
  case $opt in
    h)
      show_help
      exit 0
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
  esac
done

if [[ -n "$LANGCHAIN_TOOL_NAME" && -n "$LANGCHAIN_TOOL_TARGET" ]]; then
  if [[ "$LANGCHAIN_TOOL_TARGET" == "PYTHON" ]]; then
    cat <<EOF
import subprocess
from langchain_core.tools import tool
from typing import Optional

@tool
def $LANGCHAIN_TOOL_NAME(files: Optional[str] = None) -> str:
    """Takes a list of stats files, converts each file from its current format to CSV, and returns the combined output from all files. If files is provided, it should be a space-separated string of file paths. If not provided, will read from stdin."""
    cmd = ['./parse_binlogs.sh']
    if files:
        return subprocess.check_output(cmd, input=files, text=True)
    else:
        return subprocess.check_output(cmd, text=True)
EOF
    exit 0
  elif [[ "$LANGCHAIN_TOOL_TARGET" == "NODE" ]]; then
    cat <<EOF
const $LANGCHAIN_TOOL_NAME = tool(
  async ({ files }) => {
    const { z } = require("zod");
    const { execFileSync } = require('child_process');

    const options = { encoding: 'utf8' };
    if (files) {
      options.input = files;
    }
    return execFileSync('./parse_binlogs.sh', [], options);
  },
  {
    name: "$LANGCHAIN_TOOL_NAME",
    description: "Takes a list of stats files, converts each file from its current format to CSV, and returns the combined output from all files. If files is provided, it should be a space-separated string of file paths. If not provided, will read from stdin.",
    schema: z.object({
      files: z.string().optional().describe("Space-separated list of file paths to parse")
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

# Get file list from arguments or stdin
if [[ $# -gt 0 ]]; then
  # Files provided as arguments
  FILES="$*"
else
  # Read from stdin
  read -r FILES
fi

# Parse each file and combine outputs
FIRST_FILE=true
for file in $FILES; do
  if [[ -f "$file" ]]; then
    if $FIRST_FILE; then
      # For the first file, include headers
      blcli parse --format=csv "$file" 2>/dev/null
      FIRST_FILE=false
    else
      # For subsequent files, skip the header line
      blcli parse --format=csv "$file" 2>/dev/null | tail -n +2
    fi
  else
    echo "Warning: File not found: $file" >&2
  fi
done
