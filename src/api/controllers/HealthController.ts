import { Request, Response } from 'express';
import { DatabaseService } from '@/infra/database/DatabaseService';

export class HealthController {
  constructor(private readonly dbService: DatabaseService) {}

  checkHealth = async (_: Request, res: Response) => {
    try {
      // Check database connection
      await this.dbService.query('SELECT 1');

      return res.status(200).json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
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
