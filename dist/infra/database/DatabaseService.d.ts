import { PoolClient, QueryResult } from 'pg';
import { Knex } from 'knex';
export declare class DatabaseService {
    private static instance;
    private pool;
    private knexInstance;
    private constructor();
    static getInstance(): DatabaseService;
    getKnex(): Knex;
    query(text: string, params?: any[]): Promise<QueryResult>;
    getClient(): Promise<PoolClient>;
    disconnect(): Promise<void>;
    runMigrations(): Promise<void>;
    rollbackMigrations(): Promise<void>;
    runSeeds(): Promise<void>;
}
