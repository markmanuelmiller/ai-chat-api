import { Request, Response } from 'express';
import { DatabaseService } from '@/infra/database/DatabaseService';
export declare class HealthController {
    private readonly dbService?;
    constructor(dbService?: DatabaseService | undefined);
    checkHealth: (_: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
}
