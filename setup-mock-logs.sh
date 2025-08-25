#!/bin/bash

# Setup script for mock logs development environment

set -e

echo "Setting up mock logs for AI Chat API development..."

# Create mock logs directory structure
echo "Creating mock logs directory structure..."
mkdir -p mock-logs/binlog/active mock-logs/binlog/done

# Create sample binary log files if they don't exist
if [ ! -f "mock-logs/binlog/active/sample_log_1.bin" ]; then
    echo "Creating sample active log file..."
    cat > mock-logs/binlog/active/sample_log_1.bin << 'EOF'
# Sample binary log file for testing
# This file simulates an active binary log
# In production, this would contain actual binary log data
EOF
fi

if [ ! -f "mock-logs/binlog/done/sample_log_2.bin" ]; then
    echo "Creating sample completed log file..."
    cat > mock-logs/binlog/done/sample_log_2.bin << 'EOF'
# Sample completed binary log file for testing
# This file simulates a completed binary log
# In production, this would contain actual binary log data
EOF
fi

# Set proper permissions
chmod 755 mock-logs/binlog/active mock-logs/binlog/done

echo "Mock logs setup complete!"
echo ""
echo "Directory structure created:"
echo "  mock-logs/"
echo "  └── binlog/"
echo "      ├── active/  (contains sample_log_1.bin)"
echo "      └── done/    (contains sample_log_2.bin)"
echo ""
echo "To use with Docker:"
echo "  1. Add your actual binary log files to mock-logs/binlog/active/ and mock-logs/binlog/done/"
echo "  2. Run: docker-compose up -d"
echo "  3. The logs will be mounted to /var/log/foundation in the container"
echo ""
echo "To test the Stream Doctor Graph:"
echo "  1. Start the application: npm run cli"
echo "  2. Ask: 'debug stream abc123'"
echo "  3. The system will analyze the mock logs"
