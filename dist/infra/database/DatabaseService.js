"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const pg_1 = require("pg");
const logger_1 = require("@/utils/logger");
class DatabaseService {
    constructor() {
        this.pool = new pg_1.Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        this.pool.on('error', (err) => {
            logger_1.logger.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async query(text, params) {
        const start = Date.now();
        const res = await this.pool.query(text, params);
        const duration = Date.now() - start;
        logger_1.logger.debug(`Executed query: ${text} - ${duration}ms`);
        return res;
    }
    async getClient() {
        const client = await this.pool.connect();
        const query = client.query;
        const release = client.release;
        // Set a timeout of 5 seconds, after which we will log this client's last query
        const timeout = setTimeout(() => {
            logger_1.logger.error('A client has been checked out for more than 5 seconds!');
            logger_1.logger.error(`The last executed query on this client was: ${client.lastQuery}`);
        }, 5000);
        // Monkey patch the query method to keep track of the last query executed
        client.query = function (...args) {
            client.lastQuery = args;
            return query.apply(client, args);
        };
        client.release = () => {
            clearTimeout(timeout);
            client.query = query;
            client.release = release;
            return release.apply(client);
        };
        return client;
    }
    async disconnect() {
        await this.pool.end();
    }
    async initTables() {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            // Users table
            await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `);
            // Chats table
            await client.query(`
        CREATE TABLE IF NOT EXISTS chats (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `);
            // Messages table
            await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY,
          chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          role VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `);
            await client.query('COMMIT');
            logger_1.logger.info('Database tables initialized successfully');
        }
        catch (e) {
            await client.query('ROLLBACK');
            logger_1.logger.error('Error initializing database tables', e);
            throw e;
        }
        finally {
            client.release();
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=DatabaseService.js.map