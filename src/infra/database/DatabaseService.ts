import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '@/utils/logger';
import knex, { Knex } from 'knex';
import knexConfig from './knexfile';

// Extend PoolClient type to include our custom property
interface ExtendedPoolClient extends PoolClient {
  lastQuery?: any;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;
  private knexInstance: Knex;

  private constructor() {
    this.pool = new Pool({
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
      logger.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Initialize Knex instance
    this.knexInstance = knex(knexConfig);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getKnex(): Knex {
    return this.knexInstance;
  }

  public async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query: ${text} - ${duration}ms`);
    return res;
  }

  public async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect() as ExtendedPoolClient;
    const query = client.query;
    const release = client.release;

    // Set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
      logger.error('A client has been checked out for more than 5 seconds!');
      logger.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);

    // Monkey patch the query method to keep track of the last query executed
    client.query = function(...args: any[]): any {
      client.lastQuery = args;
      return query.apply(client, args as any);
    };

    client.release = () => {
      clearTimeout(timeout);
      client.query = query;
      client.release = release;
      return release.apply(client);
    };

    return client;
  }

  public async disconnect(): Promise<void> {
    await this.knexInstance.destroy();
    await this.pool.end();
  }

  public async runMigrations(): Promise<void> {
    try {
      await this.knexInstance.migrate.latest();
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Error running database migrations', error);
      throw error;
    }
  }

  public async rollbackMigrations(): Promise<void> {
    try {
      await this.knexInstance.migrate.rollback();
      logger.info('Database migrations rolled back successfully');
    } catch (error) {
      logger.error('Error rolling back database migrations', error);
      throw error;
    }
  }
  
  public async runSeeds(): Promise<void> {
    try {
      await this.knexInstance.seed.run();
      logger.info('Database seed data applied successfully');
    } catch (error) {
      logger.error('Error seeding database', error);
      throw error;
    }
  }
}