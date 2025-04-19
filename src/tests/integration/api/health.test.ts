import request from 'supertest';
import { createApp } from '@/app';
import { HealthController } from '@/api/controllers/HealthController';
import { DatabaseService } from '@/infra/database/DatabaseService';

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
  let app: any;

  beforeAll(() => {
    const dbService = DatabaseService.getInstance();
    const healthController = new HealthController(dbService);

    app = createApp({
      authController: {},
      chatController: {},
      healthController,
      authService: {},
    });
  });

  it('should return 200 status when database is connected', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('database', 'connected');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 503 status when database is disconnected', async () => {
    const dbService = DatabaseService.getInstance();
    (dbService.query as jest.Mock).mockRejectedValueOnce(new Error('DB connection failed'));

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'unhealthy');
    expect(response.body).toHaveProperty('database', 'disconnected');
    expect(response.body).toHaveProperty('error', 'DB connection failed');
    expect(response.body).toHaveProperty('timestamp');
  });
});
