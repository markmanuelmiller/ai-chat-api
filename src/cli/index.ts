#!/usr/bin/env node

import 'module-alias/register';
import 'dotenv/config';
import { Command } from 'commander';
import { CLIService } from './CLIService';
import { logger } from '@/utils/logger';

const program = new Command();

program
  .name('ai-chat-cli')
  .description('AI Chat CLI - Interactive chat interface using LangGraph')
  .version('1.0.0');

program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--storage <type>', 'Storage type (memory|postgres)', 'memory')
  .option('--port <number>', 'API server port', '3000');

async function main() {
  try {
    const options = program.parse().opts();
    
    // Set environment variables based on CLI options
    if (options.verbose) {
      process.env.LOG_LEVEL = 'debug';
    }
    
    // Always default to memory storage for CLI unless explicitly overridden
    if (options.storage) {
      process.env.STORAGE_TYPE = options.storage;
    } else {
      // Force memory storage for CLI by default
      process.env.STORAGE_TYPE = 'memory';
    }
    
    if (options.port) {
      process.env.STREAM_DOCTOR_PORT = options.port;
    }

    logger.info('Starting AI Chat CLI...');
    logger.info(`Storage type: ${process.env.STORAGE_TYPE}`);
    
    const cliService = new CLIService(process.env.STORAGE_TYPE);
    await cliService.start();
    
  } catch (error) {
    console.error('Error starting CLI:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down CLI gracefully...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
