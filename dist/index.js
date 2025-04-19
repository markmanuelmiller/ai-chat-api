"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const env_1 = require("@/config/env");
const app_1 = require("@/app");
const logger_1 = require("@/utils/logger");
const registerHandlers_1 = require("@/interfaces/ws/registerHandlers");
const WebSocketManager_1 = require("@/interfaces/ws/WebSocketManager");
// Repositories
const DatabaseService_1 = require("@/infra/database/DatabaseService");
const PgUserRepository_1 = require("@/infra/repositories/PgUserRepository");
const PgChatRepository_1 = require("@/infra/repositories/PgChatRepository");
const PgMessageRepository_1 = require("@/infra/repositories/PgMessageRepository");
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
        // Initialize database
        const dbService = DatabaseService_1.DatabaseService.getInstance();
        await dbService.initTables();
        logger_1.logger.info('Database initialized');
        // Setup repositories
        const userRepository = new PgUserRepository_1.PgUserRepository(dbService);
        const chatRepository = new PgChatRepository_1.PgChatRepository(dbService);
        const messageRepository = new PgMessageRepository_1.PgMessageRepository(dbService);
        // Setup domain services
        const jwtService = new JwtService_1.JwtService();
        const eventEmitter = DomainEventEmitter_1.DomainEventEmitter.getInstance();
        // Setup application services
        const authService = new AuthService_1.AuthService(userRepository, jwtService);
        const chatService = new ChatService_1.ChatService(chatRepository, messageRepository, eventEmitter);
        const aiService = new AIService_1.AIService(chatRepository, messageRepository, eventEmitter);
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
        const wsManager = new WebSocketManager_1.WebSocketManager(server, userRepository, env_1.env.JWT_SECRET);
        (0, registerHandlers_1.registerWebSocketHandlers)(wsManager, chatService, aiService);
        // Start server
        server.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`Server is running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode`);
        });
        // Handle shutdown
        const shutdown = async () => {
            logger_1.logger.info('Shutting down gracefully...');
            server.close();
            await dbService.disconnect();
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