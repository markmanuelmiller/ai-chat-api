# StreamDoctor Troubleshooting Guide

## Issue Summary
The StreamDoctor graph execution was hanging at the `list_binlogs.sh` tool call due to several issues:

1. **Missing log directories**: The script was trying to access `/var/log/foundation/binlog/active` and `/var/log/foundation/binlog/done` which don't exist in the development environment
2. **No error handling**: The script would hang indefinitely when directories don't exist
3. **Missing timeout protection**: No timeout mechanism to prevent infinite hanging
4. **Cross-platform compatibility**: The `timeout` command is not available on macOS

## Root Causes Identified

### 1. Environment Configuration
- **Problem**: Script expects log directories that don't exist in development
- **Solution**: Added proper environment variable handling and fallback behavior

### 2. Script Hanging
- **Problem**: `find` commands would hang when directories don't exist
- **Solution**: Added directory existence checks and graceful error handling

### 3. Buffer Overflow (ENOBUFS)
- **Problem**: Large file processing causing memory issues
- **Solution**: Added timeout and better buffer management

## Fixes Applied

### 1. Enhanced `list_binlogs.sh` Script
```bash
# Added directory existence checks
if [[ ! -d "$BIN_LOG_ACTIVE_DIR_PATH" ]]; then
  echo "Warning: Active directory does not exist: $BIN_LOG_ACTIVE_DIR_PATH" >&2
  ACTIVE_DIR_EXISTS=false
else
  ACTIVE_DIR_EXISTS=true
fi

# Added timeout protection (cross-platform)
if command -v timeout >/dev/null 2>&1; then
  timeout 10 bash -c "$FIND_COMMANDS" | tr '\n' ' ' | sed 's/ $/\n/'
else
  bash -c "$FIND_COMMANDS" | tr '\n' ' ' | sed 's/ $/\n/'
fi
```

### 2. Improved Tool Implementation
```typescript
// Added environment setup and timeout
const options: any = { 
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 100, // 100MB buffer
  timeout: 30000, // 30 second timeout
  env: {
    ...process.env,
    BIN_LOG_ACTIVE_DIR_PATH: process.env.BIN_LOG_ACTIVE_DIR_PATH || '/var/log/foundation/binlog/active',
    BIN_LOG_DONE_DIR_PATH: process.env.BIN_LOG_DONE_DIR_PATH || '/var/log/foundation/binlog/done'
  }
};
```

### 3. Better Error Handling
```typescript
try {
  console.log('DEBUG: Invoking listStatsFiles with args:', toolCall.args);
  result = await listStatsFiles.invoke(toolCall.args);
  console.log('DEBUG: listStatsFiles result length:', result?.length || 0);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('DEBUG: listStatsFiles error:', error);
  return {
    error: `Failed to list stats files: ${errorMessage}`,
  };
}
```

## Testing Tools Created

### 1. Environment Test Script
```bash
./scripts/test_stream_doctor_env.sh
```
This script checks:
- Script existence and permissions
- Environment variables
- Directory accessibility
- Script execution with timeout

### 2. Test Environment Setup
```bash
./scripts/setup_test_env.sh
```
This script creates:
- Mock log directories
- Sample log files
- Proper environment variables for testing

## Usage Instructions

### For Development/Testing
1. Set up test environment:
   ```bash
   ./scripts/setup_test_env.sh
   ```

2. Test the script:
   ```bash
   BIN_LOG_ACTIVE_DIR_PATH=/tmp/stream-doctor-test/active \
   BIN_LOG_DONE_DIR_PATH=/tmp/stream-doctor-test/done \
   ./scripts/list_binlogs.sh
   ```

3. Run environment test:
   ```bash
   ./scripts/test_stream_doctor_env.sh
   ```

### For Production
1. Ensure log directories exist:
   ```bash
   mkdir -p /var/log/foundation/binlog/{active,done}
   ```

2. Set proper permissions:
   ```bash
   chmod 755 /var/log/foundation/binlog/{active,done}
   ```

3. Configure environment variables if needed:
   ```bash
   export BIN_LOG_ACTIVE_DIR_PATH="/custom/path/to/active"
   export BIN_LOG_DONE_DIR_PATH="/custom/path/to/done"
   ```

## Monitoring and Debugging

### Key Log Messages to Watch
- `Current working directory: /root/build/stream-doctor`
- `Script exists: true`
- `list_binlogs.sh Arguments: []`
- `StreamDoctor environment setup: {...}`

### Common Error Patterns
1. **Directory not found**: Script returns empty result instead of hanging
2. **Permission denied**: Check directory permissions
3. **Timeout**: Script execution takes longer than 30 seconds
4. **Buffer overflow**: Increase `maxBuffer` size if needed

## Performance Considerations

### Memory Management
- Current buffer size: 100MB
- Timeout: 30 seconds
- Consider adjusting based on file sizes and system resources

### File Processing
- Large files may cause ENOBUFS errors
- Consider implementing streaming for very large datasets
- Monitor system memory usage during processing

## Future Improvements

1. **Streaming Processing**: Implement streaming for large file processing
2. **Caching**: Add caching for frequently accessed metadata
3. **Metrics**: Add performance metrics and monitoring
4. **Configuration**: Make buffer sizes and timeouts configurable
5. **Retry Logic**: Add retry mechanism for transient failures

## Cleanup
To remove test environment:
```bash
rm -rf /tmp/stream-doctor-test
```
