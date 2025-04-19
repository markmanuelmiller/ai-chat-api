import { createServer } from 'http';
import { env } from '@/config/env';
import { createApp } from '@/app';
import { logger } from '@/utils/logger';
import { registerWebSocketHandlers } from '@/interfaces/ws/registerHandlers';
import { WebSocketManager } from '@/interfaces/ws/WebSocketManager';

// Repositories
import { DatabaseService } from '@/infra/database/DatabaseService';
import { PgUserRepository } from '@/infra/repositories/PgUserRepository';
import { PgChatRepository } from '@/infra/repositories/PgChatRepository';
import { PgMessageRepository } from '@/infra/repositories/PgMessageRepository';

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
    // Initialize database
    const dbService = DatabaseService.getInstance();
    await dbService.runMigrations();
    logger.info('Database migrations applied successfully');

    // Setup repositories
    const userRepository = new PgUserRepository(dbService);
    const chatRepository = new PgChatRepository(dbService);
    const messageRepository = new PgMessageRepository(dbService);

    // Setup domain services
    const jwtService = new JwtService();
    const eventEmitter = DomainEventEmitter.getInstance();

    // Setup application services
    const authService = new AuthService(userRepository, jwtService);
    const chatService = new ChatService(chatRepository, messageRepository, eventEmitter);
    const aiService = new AIService(chatRepository, messageRepository, eventEmitter);

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
    const wsManager = new WebSocketManager(server, userRepository, env.JWT_SECRET);
    registerWebSocketHandlers(wsManager, chatService, aiService);

    // Start server
    server.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Handle shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close();
      await dbService.disconnect();
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
