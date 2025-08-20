"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const pg_1 = require("pg");
const logger_1 = require("@/utils/logger");
const knex_1 = __importDefault(require("knex"));
const knexfile_1 = __importDefault(require("./knexfile"));
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
        // Initialize Knex instance
        this.knexInstance = (0, knex_1.default)(knexfile_1.default);
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    getKnex() {
        return this.knexInstance;
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
        await this.knexInstance.destroy();
        await this.pool.end();
    }
    async runMigrations() {
        try {
            await this.knexInstance.migrate.latest();
            logger_1.logger.info('Database migrations completed successfully');
        }
        catch (error) {
            logger_1.logger.error('Error running database migrations', error);
            throw error;
        }
    }
    async rollbackMigrations() {
        try {
            await this.knexInstance.migrate.rollback();
            logger_1.logger.info('Database migrations rolled back successfully');
        }
        catch (error) {
            logger_1.logger.error('Error rolling back database migrations', error);
            throw error;
        }
    }
    async runSeeds() {
        try {
            await this.knexInstance.seed.run();
            logger_1.logger.info('Database seed data applied successfully');
        }
        catch (error) {
            logger_1.logger.error('Error seeding database', error);
            throw error;
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=DatabaseService.js.map