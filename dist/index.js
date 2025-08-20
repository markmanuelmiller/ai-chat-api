"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
require("dotenv/config");
const http_1 = require("http");
const config_1 = require("@/config/config");
const app_1 = require("@/app");
const logger_1 = require("@/utils/logger");
const registerHandlers_1 = require("@/interfaces/ws/registerHandlers");
const WebSocketManager_1 = require("@/interfaces/ws/WebSocketManager");
// Repositories
const DatabaseService_1 = require("@/infra/database/DatabaseService");
const RepositoryFactory_1 = require("@/infra/repositories/RepositoryFactory");
// Services
const AuthService_1 = require("@/application/services/AuthService");
const ChatService_1 = require("@/application/services/ChatService");
const AIService_1 = require("@/application/services/AIService");
const JwtService_1 = require("@/infra/auth/JwtService");
const DomainEventEmitter_1 = require("@/domain/events/DomainEventEmitter");
// Controllers
const AuthController_1 = require("@/api/controllers/AuthController");
const ChatController_1 = require("@/api/controllers/ChatController");
const HealthController_1 = require("@/api/controllers/HealthController");
async function bootstrap() {
    try {
        let dbService;
        // Initialize database only if using PostgreSQL
        if (config_1.config.STORAGE_TYPE === 'postgres') {
            dbService = DatabaseService_1.DatabaseService.getInstance();
            await dbService.runMigrations();
            logger_1.logger.info('Database migrations applied successfully');
        }
        else {
            logger_1.logger.info('Using in-memory storage');
        }
        // Setup repositories using factory
        const { userRepository, chatRepository, messageRepository } = RepositoryFactory_1.RepositoryFactory.createRepositories(config_1.config.STORAGE_TYPE, dbService);
        // Setup domain services
        const jwtService = new JwtService_1.JwtService();
        const eventEmitter = DomainEventEmitter_1.DomainEventEmitter.getInstance();
        // Setup application services
        const authService = new AuthService_1.AuthService(userRepository, jwtService);
        const chatService = new ChatService_1.ChatService(chatRepository, messageRepository, eventEmitter);
        // Setup controllers
        const authController = new AuthController_1.AuthController(authService);
        const chatController = new ChatController_1.ChatController(chatService);
        const healthController = new HealthController_1.HealthController(dbService);
        // Create Express app
        const app = (0, app_1.createApp)({
            authController,
            chatController,
            healthController,
            authService,
        });
        // Create HTTP server
        const server = (0, http_1.createServer)(app);
        // Setup WebSockets
        const wsManager = new WebSocketManager_1.WebSocketManager(server, userRepository, config_1.config.JWT_SECRET);
        // Initialize AI Service
        const aiService = new AIService_1.AIService(chatRepository, messageRepository, eventEmitter, config_1.config, wsManager);
        // Register WebSocket handlers
        (0, registerHandlers_1.registerWebSocketHandlers)(wsManager, chatService, aiService);
        // Start server
        server.listen(config_1.config.STREAM_DOCTOR_PORT, () => {
            logger_1.logger.info(`Server is running on port ${config_1.config.STREAM_DOCTOR_PORT} in ${config_1.config.NODE_ENV} mode`);
            logger_1.logger.info(`Storage type: ${config_1.config.STORAGE_TYPE}`);
        });
        // Handle shutdown
        const shutdown = async () => {
            logger_1.logger.info('Shutting down gracefully...');
            server.close();
            if (dbService) {
                await dbService.disconnect();
            }
            process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
    catch (error) {
        logger_1.logger.error('Error starting server', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map