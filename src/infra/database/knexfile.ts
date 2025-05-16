import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../.env') });

// Default configuration
const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ai_chat',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: resolve(__dirname, './migrations'),
    extension: 'ts',
  },
  seeds: {
    directory: resolve(__dirname, './seeds'),
    extension: 'ts',
  },
};

// Define type for our environments
type Environment = typeof config;
type Environments = {
  [key: string]: Environment;
};

// Environment-specific configurations
const environments: Environments = {
  development: {
    ...config,
  },
  production: {
    ...config,
    pool: {
      min: 2,
      max: 20,
    },
  },
  test: {
    ...config,
    connection: {
      ...config.connection,
      database: `${process.env.DB_NAME || 'ai_chat'}_test`,
    },
  },
};

// Export configuration based on current NODE_ENV
const environment = process.env.NODE_ENV || 'development';
export default environments[environment] || environments.development;