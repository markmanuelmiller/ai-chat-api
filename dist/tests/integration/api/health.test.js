"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("@/app");
const HealthController_1 = require("@/api/controllers/HealthController");
const DatabaseService_1 = require("@/infra/database/DatabaseService");
// Mock database service
jest.mock('@/infra/database/DatabaseService', () => {
    return {
        DatabaseService: {
            getInstance: jest.fn().mockReturnValue({
                query: jest.fn().mockResolvedValue({ rows: [{ result: 1 }] }),
            }),
        },
    };
});
describe('Health Endpoint', () => {
    let app;
    beforeAll(() => {
        const dbService = DatabaseService_1.DatabaseService.getInstance();
        const healthController = new HealthController_1.HealthController(dbService);
        app = (0, app_1.createApp)({
            authController: {},
            chatController: {},
            healthController,
            authService: {},
        });
    });
    it('should return 200 status when database is connected', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'healthy');
        expect(response.body).toHaveProperty('database', 'connected');
        expect(response.body).toHaveProperty('timestamp');
    });
    it('should return 503 status when database is disconnected', async () => {
        const dbService = DatabaseService_1.DatabaseService.getInstance();
        dbService.query.mockRejectedValueOnce(new Error('DB connection failed'));
        const response = await (0, supertest_1.default)(app).get('/api/health');
        expect(response.status).toBe(503);
        expect(response.body).toHaveProperty('status', 'unhealthy');
        expect(response.body).toHaveProperty('database', 'disconnected');
        expect(response.body).toHaveProperty('error', 'DB connection failed');
        expect(response.body).toHaveProperty('timestamp');
    });
});
//# sourceMappingURL=health.test.js.map