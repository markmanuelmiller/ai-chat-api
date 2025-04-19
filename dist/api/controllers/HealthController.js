"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
class HealthController {
    constructor(dbService) {
        this.dbService = dbService;
        this.checkHealth = async (_, res) => {
            try {
                // Check database connection
                await this.dbService.query('SELECT 1');
                return res.status(200).json({
                    status: 'healthy',
                    database: 'connected',
                    timestamp: new Date().toISOString(),
                });
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