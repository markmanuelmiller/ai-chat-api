import { PoolClient, QueryResult } from 'pg';
export declare class DatabaseService {
    private static instance;
    private pool;
    private constructor();
    static getInstance(): DatabaseService;
    query(text: string, params?: any[]): Promise<QueryResult>;
    getClient(): Promise<PoolClient>;
    disconnect(): Promise<void>;
    initTables(): Promise<void>;
}
