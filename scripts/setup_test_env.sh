#!/bin/bash

echo "=== Setting up Stream Doctor Test Environment ==="

# Create test directories
TEST_BASE="/tmp/stream-doctor-test"
ACTIVE_DIR="$TEST_BASE/active"
DONE_DIR="$TEST_BASE/done"

echo "Creating test directories..."
mkdir -p "$ACTIVE_DIR" "$DONE_DIR"

# Create some mock log files
echo "Creating mock log files..."
for i in {1..5}; do
  echo "mock_data_$i" > "$ACTIVE_DIR/binlog_$(date +%Y%m%d)_$i.bin"
  echo "mock_data_$i" > "$DONE_DIR/binlog_$(date +%Y%m%d)_$i.bin"
done

# Set environment variables for testing
export BIN_LOG_ACTIVE_DIR_PATH="$ACTIVE_DIR"
export BIN_LOG_DONE_DIR_PATH="$DONE_DIR"

echo "Test environment created:"
echo "  Active directory: $ACTIVE_DIR"
echo "  Done directory: $DONE_DIR"
echo "  Total files: $(find "$TEST_BASE" -type f | wc -l)"
echo ""
echo "Environment variables set:"
echo "  BIN_LOG_ACTIVE_DIR_PATH=$BIN_LOG_ACTIVE_DIR_PATH"
echo "  BIN_LOG_DONE_DIR_PATH=$BIN_LOG_DONE_DIR_PATH"
echo ""
echo "To test the list_binlogs.sh script, run:"
echo "  BIN_LOG_ACTIVE_DIR_PATH=$ACTIVE_DIR BIN_LOG_DONE_DIR_PATH=$DONE_DIR ./scripts/list_binlogs.sh"
echo ""
echo "To clean up the test environment, run:"
echo "  rm -rf $TEST_BASE"
