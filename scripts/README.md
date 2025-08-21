# Stream Doctor Scripts

This directory contains the shell scripts and supporting files for the Stream Doctor functionality, which analyzes binary log data from video streaming systems.

## Scripts

### `list_binlogs.sh`
Lists all available binary log files with optional time-based filtering.

**Usage:**
```bash
./list_binlogs.sh [OPTIONS]
```

**Options:**
- `-m MINUTES`: Filter files modified in the last MINUTES
- `-c MINUTES`: Filter files changed in the last MINUTES
- `-n PATTERN`: Filter files by name pattern
- `-h, --help`: Show help message

**Examples:**
```bash
# List all files
./list_binlogs.sh

# List files modified in the last hour
./list_binlogs.sh -m 60

# List files changed in the last 2 hours
./list_binlogs.sh -c 120
```

### `parse_binlogs.sh`
Converts binary log files to CSV format using the `blcli` tool.

**Usage:**
```bash
./parse_binlogs.sh [FILES...]
```

**Examples:**
```bash
# Parse files provided as arguments
./parse_binlogs.sh file1.bin file2.bin

# Parse files from stdin (output of list_binlogs.sh)
./list_binlogs.sh | ./parse_binlogs.sh
```

### `describe_records.sh`
Describes the structure of binary log records and their CSV columns.

**Usage:**
```bash
./describe_records.sh [OPTIONS]
```

**Options:**
- `-t TYPES`: Comma-separated list of record types to describe
- `-j, --json`: Output in JSON format
- `-h, --help`: Show help message

**Examples:**
```bash
# List all available record types
./describe_records.sh

# Describe specific record types
./describe_records.sh -t rtpproducer,rtpconsumer

# Get JSON output
./describe_records.sh -t rtpproducer -j
```

### `filter_csv.sh`
Processes CSV data using shell commands with security sandboxing via firejail.

**Usage:**
```bash
./filter_csv.sh [OPTIONS] COMMAND
```

**Options:**
- `-i FILE`: Read input from FILE instead of stdin
- `-o FILE`: Write output to FILE instead of stdout
- `-h, --help`: Show help message

**Examples:**
```bash
# Count records per record type
./filter_csv.sh "cut -d, -f7 | sort | uniq -c"

# Filter for specific record type
./filter_csv.sh "grep 'rtpproducer'"

# Complex analysis
./filter_csv.sh "awk -F',' '{sum+=\$9} END {print sum}'"
```

## Supporting Files

### `type.json`
Contains the complete schema definition for all record types, including field descriptions and metadata.

### `modules.json`
Contains descriptions of the different modules that generate log records.

## Dependencies

The scripts require the following system dependencies:

- `blcli`: Binary log parsing tool
- `jq`: JSON processing tool
- `firejail`: Security sandboxing tool
- Standard Unix tools: `find`, `grep`, `awk`, `cut`, `sort`, `uniq`, etc.

## Environment Variables

The scripts use the following environment variables for configuration:

- `BIN_LOG_ACTIVE_DIR_PATH`: Path to active binary log directory (default: `/var/log/foundation/binlog/active`)
- `BIN_LOG_DONE_DIR_PATH`: Path to completed binary log directory (default: `/var/log/foundation/binlog/done`)

## Security

The `filter_csv.sh` script uses firejail to provide security sandboxing when executing user-provided shell commands. This prevents access to sensitive system files and directories.

## Integration with AI Chat API

These scripts are integrated into the AI Chat API through the Stream Doctor Graph, which provides:

1. **Metadata Analysis**: Queries about data structure and schema
2. **Data Analysis**: Queries about actual log data and statistics
3. **Time-based Filtering**: Natural language time expressions converted to file filters
4. **Record Type Selection**: Automatic selection of relevant record types based on user queries

The Stream Doctor Graph routes user queries through these scripts to provide comprehensive analysis of streaming system logs.
