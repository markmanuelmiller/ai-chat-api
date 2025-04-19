import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '@/utils/logger';

// Extend PoolClient type to include our custom property
interface ExtendedPoolClient extends PoolClient {
  lastQuery?: any;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;

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
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
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
    await this.pool.end();
  }

  public async initTables(): Promise<void> {
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
      logger.info('Database tables initialized successfully');
    } catch (e) {
      await client.query('ROLLBACK');
      logger.error('Error initializing database tables', e);
      throw e;
    } finally {
      client.release();
    }
  }
}
