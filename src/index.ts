import 'module-alias/register';
import 'dotenv/config';
import { createServer } from 'http';
import { config } from '@/config/config';
import { createApp } from '@/app';
import { logger } from '@/utils/logger';
import { registerWebSocketHandlers } from '@/interfaces/ws/registerHandlers';
import { WebSocketManager } from '@/interfaces/ws/WebSocketManager';

// Repositories
import { DatabaseService } from '@/infra/database/DatabaseService';
import { RepositoryFactory } from '@/infra/repositories/RepositoryFactory';

// Services
import { AuthService } from '@/application/services/AuthService';
import { ChatService } from '@/application/services/ChatService';
import { AIService } from '@/application/services/AIService';
import { JwtService } from '@/infra/auth/JwtService';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';

// Controllers
import { AuthController } from '@/api/controllers/AuthController';
import { ChatController } from '@/api/controllers/ChatController';
import { HealthController } from '@/api/controllers/HealthController';

async function bootstrap() {
  try {
    let dbService: DatabaseService | undefined;

    // Initialize database only if using PostgreSQL
    if (config.STORAGE_TYPE === 'postgres') {
      dbService = DatabaseService.getInstance();
      await dbService.runMigrations();
      logger.info('Database migrations applied successfully');
    } else {
      logger.info('Using in-memory storage');
    }

    // Setup repositories using factory
    const { userRepository, chatRepository, messageRepository } = RepositoryFactory.createRepositories(
      config.STORAGE_TYPE,
      dbService
    );

    // Setup domain services
    const jwtService = new JwtService();
    const eventEmitter = DomainEventEmitter.getInstance();

    // Setup application services
    const authService = new AuthService(userRepository, jwtService);
    const chatService = new ChatService(chatRepository, messageRepository, eventEmitter);

    // Setup controllers
    const authController = new AuthController(authService);
    const chatController = new ChatController(chatService);
    const healthController = new HealthController(dbService);

    // Create Express app
    const app = createApp({
      authController,
      chatController,
      healthController,
      authService,
    });

    // Create HTTP server
    const server = createServer(app);

    // Setup WebSockets
    const wsManager = new WebSocketManager(server, userRepository, config.JWT_SECRET);

    // Initialize AI Service
    const aiService = new AIService(
      chatRepository, 
      messageRepository, 
      eventEmitter,
      config,
      wsManager,
    );

    // Register WebSocket handlers
    registerWebSocketHandlers(wsManager, chatService, aiService);

    // Start server
    server.listen(config.STREAM_DOCTOR_PORT, () => {
      logger.info(`Server is running on port ${config.STREAM_DOCTOR_PORT} in ${config.NODE_ENV} mode`);
      logger.info(`Storage type: ${config.STORAGE_TYPE}`);
    });

    // Handle shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close();
      if (dbService) {
        await dbService.disconnect();
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Error starting server', error);
    process.exit(1);
  }
}

bootstrap();
