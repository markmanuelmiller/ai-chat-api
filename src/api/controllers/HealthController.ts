import { Request, Response } from 'express';
import { DatabaseService } from '@/infra/database/DatabaseService';

export class HealthController {
  constructor(private readonly dbService?: DatabaseService) {}

  checkHealth = async (_: Request, res: Response) => {
    try {
      if (this.dbService) {
        // Check database connection if using PostgreSQL
        await this.dbService.query('SELECT 1');
        
        return res.status(200).json({
          status: 'healthy',
          database: 'connected',
          storage: 'postgres',
          timestamp: new Date().toISOString(),
        });
      } else {
        // In-memory storage - no database to check
        return res.status(200).json({
          status: 'healthy',
          database: 'not_applicable',
          storage: 'memory',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
