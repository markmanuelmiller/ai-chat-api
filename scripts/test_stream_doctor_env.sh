#!/bin/bash

echo "=== Stream Doctor Environment Test ==="
echo "Current working directory: $(pwd)"
echo "Scripts directory: $(dirname "$0")"
echo ""

# Check if list_binlogs.sh exists and is executable
LIST_BINLOGS_SCRIPT="$(dirname "$0")/list_binlogs.sh"
echo "Checking list_binlogs.sh script:"
echo "  Path: $LIST_BINLOGS_SCRIPT"
echo "  Exists: $([ -f "$LIST_BINLOGS_SCRIPT" ] && echo "YES" || echo "NO")"
echo "  Executable: $([ -x "$LIST_BINLOGS_SCRIPT" ] && echo "YES" || echo "NO")"
echo ""

# Check environment variables
echo "Environment variables:"
echo "  BIN_LOG_ACTIVE_DIR_PATH: ${BIN_LOG_ACTIVE_DIR_PATH:-/var/log/foundation/binlog/active (default)}"
echo "  BIN_LOG_DONE_DIR_PATH: ${BIN_LOG_DONE_DIR_PATH:-/var/log/foundation/binlog/done (default)}"
echo ""

# Check if directories exist
echo "Checking log directories:"
ACTIVE_DIR="${BIN_LOG_ACTIVE_DIR_PATH:-/var/log/foundation/binlog/active}"
DONE_DIR="${BIN_LOG_DONE_DIR_PATH:-/var/log/foundation/binlog/done}"

echo "  Active directory ($ACTIVE_DIR):"
echo "    Exists: $([ -d "$ACTIVE_DIR" ] && echo "YES" || echo "NO")"
echo "    Readable: $([ -r "$ACTIVE_DIR" ] && echo "YES" || echo "NO")"
echo "    Files count: $([ -d "$ACTIVE_DIR" ] && find "$ACTIVE_DIR" -type f 2>/dev/null | wc -l || echo "N/A")"

echo "  Done directory ($DONE_DIR):"
echo "    Exists: $([ -d "$DONE_DIR" ] && echo "YES" || echo "NO")"
echo "    Readable: $([ -r "$DONE_DIR" ] && echo "YES" || echo "NO")"
echo "    Files count: $([ -d "$DONE_DIR" ] && find "$DONE_DIR" -type f 2>/dev/null | wc -l || echo "N/A")"
echo ""

# Test list_binlogs.sh execution
echo "Testing list_binlogs.sh execution:"
if [ -f "$LIST_BINLOGS_SCRIPT" ] && [ -x "$LIST_BINLOGS_SCRIPT" ]; then
  echo "  Running: $LIST_BINLOGS_SCRIPT"
  # Use timeout if available, otherwise run without timeout
  if command -v timeout >/dev/null 2>&1; then
    timeout 10 "$LIST_BINLOGS_SCRIPT" 2>&1
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
      echo "  Result: TIMEOUT (script took longer than 10 seconds)"
    elif [ $EXIT_CODE -eq 0 ]; then
      echo "  Result: SUCCESS"
    else
      echo "  Result: FAILED (exit code: $EXIT_CODE)"
    fi
  else
    "$LIST_BINLOGS_SCRIPT" 2>&1
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo "  Result: SUCCESS"
    else
      echo "  Result: FAILED (exit code: $EXIT_CODE)"
    fi
  fi
else
  echo "  Result: SCRIPT NOT FOUND OR NOT EXECUTABLE"
fi
echo ""

# Check system resources
echo "System resources:"
echo "  Available memory: $(free -h | grep Mem | awk '{print $7}')"
echo "  Disk space: $(df -h . | tail -1 | awk '{print $4}') available"
echo ""

echo "=== Test Complete ==="
