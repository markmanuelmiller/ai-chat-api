"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
class HealthController {
    constructor(dbService) {
        this.dbService = dbService;
        this.checkHealth = async (_, res) => {
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
                }
                else {
                    // In-memory storage - no database to check
                    return res.status(200).json({
                        status: 'healthy',
                        database: 'not_applicable',
                        storage: 'memory',
                        timestamp: new Date().toISOString(),
                    });
                }
            }
            catch (error) {
                return res.status(503).json({
                    status: 'unhealthy',
                    database: 'disconnected',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                });
            }
        };
    }
}
exports.HealthController = HealthController;
//# sourceMappingURL=HealthController.js.map