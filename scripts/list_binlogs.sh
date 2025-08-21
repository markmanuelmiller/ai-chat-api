#!/bin/bash

show_help() {
  echo "Usage: $(basename "$0") [OPTIONS]"
  echo ""
  echo "List all available binary log files."
  echo ""
  echo "Options:"
  echo "  -h, --help           Show this help message and exit"
  echo "  -m MINUTES           Filter files modified in the last MINUTES (find -mmin)"
  echo "  -c MINUTES           Filter files changed in the last MINUTES (find -cmin)"
  echo "  -n PATTERN           Filter files by name pattern (find -name PATTERN)"
  echo "      --langchain-tool TOOLNAME PYTHON|NODE"
  echo "                       Output a LangChain tool descriptor for Python or Node.js with the given tool name and exit"
}

# Defaults
MTIME_FILTER=""
CTIME_FILTER=""
NAME_FILTER=""
LANGCHAIN_TOOL_NAME=""
LANGCHAIN_TOOL_TARGET=""

# Parse options
while getopts ":hm:c:n:-:" opt; do
  case $opt in
    h)
      show_help
      exit 0
      ;;
    m)
      MTIME_FILTER="-mmin $OPTARG"
      ;;
    c)
      CTIME_FILTER="-cmin $OPTARG"
      ;;
    n)
      NAME_FILTER="-name $OPTARG"
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
def $LANGCHAIN_TOOL_NAME(m: Optional[int] = None, c: Optional[int] = None, n: Optional[str] = None) -> str:
    """List all available binary log files as a single line separated by spaces. Optional filters: -m MINUTES (modified in last MINUTES), -c MINUTES (changed in last MINUTES), -n PATTERN (name pattern)."""
    cmd = ['./list_binlogs.sh']
    if m is not None:
        cmd += ['-m', str(m)]
    if c is not None:
        cmd += ['-c', str(c)]
    if n is not None:
        cmd += ['-n', n]
    return subprocess.check_output(cmd, text=True)
EOF
    exit 0
  elif [[ "$LANGCHAIN_TOOL_TARGET" == "NODE" ]]; then
    cat <<EOF
const $LANGCHAIN_TOOL_NAME = tool(
  async ({ m, c, n }) => {
    const { z } = require("zod");
    const { execFileSync } = require('child_process');

    const args = [];
    if (m !== undefined) args.push('-m', String(m));
    if (c !== undefined) args.push('-c', String(c));
    if (n) args.push('-n', n);
    return execFileSync('./list_binlogs.sh', args, { encoding: 'utf8' });
  },
  {
    name: "$LANGCHAIN_TOOL_NAME",
    description: "List all available binary log files as a single line separated by spaces. Optional filters: -m MINUTES (modified in last MINUTES), -c MINUTES (changed in last MINUTES), -n PATTERN (name pattern).",
    schema: z.object({
      m: z.number().optional().describe("Modified in last MINUTES"),
      c: z.number().optional().describe("Changed in last MINUTES"),
      n: z.string().optional().describe("Name pattern")
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

# Only one of -m or -c can be used
if [[ -n "$MTIME_FILTER" && -n "$CTIME_FILTER" ]]; then
  echo "Error: Use only one of -m or -c at a time." >&2
  exit 1
fi

TIME_FILTER="$MTIME_FILTER $CTIME_FILTER"

# Set default paths if not set
BIN_LOG_ACTIVE_DIR_PATH="${BIN_LOG_ACTIVE_DIR_PATH:-/var/log/foundation/binlog/active}"
BIN_LOG_DONE_DIR_PATH="${BIN_LOG_DONE_DIR_PATH:-/var/log/foundation/binlog/done}"

{
  find "$BIN_LOG_ACTIVE_DIR_PATH" -type f $TIME_FILTER $NAME_FILTER 2>/dev/null
  find "$BIN_LOG_DONE_DIR_PATH" -type f $TIME_FILTER $NAME_FILTER 2>/dev/null
} | tr '\n' ' ' | sed 's/ $/\n/'
