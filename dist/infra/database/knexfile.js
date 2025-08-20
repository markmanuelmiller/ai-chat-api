"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
// Load environment variables
dotenv_1.default.config({ path: (0, path_1.resolve)(__dirname, '../../../.env') });
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
        directory: (0, path_1.resolve)(__dirname, './migrations'),
        extension: 'ts',
    },
    seeds: {
        directory: (0, path_1.resolve)(__dirname, './seeds'),
        extension: 'ts',
    },
};
// Environment-specific configurations
const environments = {
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
exports.default = environments[environment] || environments.development;
//# sourceMappingURL=knexfile.js.map