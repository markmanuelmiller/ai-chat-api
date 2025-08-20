"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIService = void 0;
const config_1 = require("@/config/config");
const logger_1 = require("@/utils/logger");
// Repositories
const DatabaseService_1 = require("@/infra/database/DatabaseService");
const RepositoryFactory_1 = require("@/infra/repositories/RepositoryFactory");
// Services
const AuthService_1 = require("@/application/services/AuthService");
const ChatService_1 = require("@/application/services/ChatService");
const AIService_1 = require("@/application/services/AIService");
const JwtService_1 = require("@/infra/auth/JwtService");
const DomainEventEmitter_1 = require("@/domain/events/DomainEventEmitter");
// CLI Components
const CLIMenuManager_1 = require("./CLIMenuManager");
const CLIChatManager_1 = require("./CLIChatManager");
const CLIInputManager_1 = require("./CLIInputManager");
class CLIService {
    constructor(storageType = 'memory') {
        this.storageType = storageType;
        this.state = {
            isInChat: false,
            userId: 'cli-user', // Default CLI user ID
        };
    }
    async start() {
        try {
            await this.initializeServices();
            await this.authenticateUser();
            await this.showMainMenu();
        }
        catch (error) {
            logger_1.logger.error('Error in CLI service:', error);
            throw error;
        }
    }
    async initializeServices() {
        logger_1.logger.info('Initializing CLI services...');
        // Initialize database if using PostgreSQL
        if (this.storageType === 'postgres') {
            this.dbService = DatabaseService_1.DatabaseService.getInstance();
            await this.dbService.runMigrations();
            logger_1.logger.info('Database migrations applied successfully');
        }
        else {
            logger_1.logger.info('Using in-memory storage');
        }
        // Setup repositories using factory
        const { userRepository, chatRepository, messageRepository } = RepositoryFactory_1.RepositoryFactory.createRepositories(this.storageType, this.dbService);
        // Setup domain services
        const jwtService = new JwtService_1.JwtService();
        const eventEmitter = DomainEventEmitter_1.DomainEventEmitter.getInstance();
        // Setup application services
        this.authService = new AuthService_1.AuthService(userRepository, jwtService);
        this.chatService = new ChatService_1.ChatService(chatRepository, messageRepository, eventEmitter);
        // Create a mock WebSocket manager for CLI compatibility
        const mockWebSocketManager = {
            getOrCreateQueue: () => ({
                addMessage: () => { }, // No-op for CLI
                close: () => { },
            }),
        };
        this.aiService = new AIService_1.AIService(chatRepository, messageRepository, eventEmitter, config_1.config, mockWebSocketManager);
        // Initialize CLI components
        this.menuManager = new CLIMenuManager_1.CLIMenuManager();
        this.chatManager = new CLIChatManager_1.CLIChatManager(this.chatService, this.aiService);
        this.inputManager = new CLIInputManager_1.CLIInputManager();
        logger_1.logger.info('CLI services initialized successfully');
    }
    async authenticateUser() {
        try {
            // For CLI, we'll use a simple authentication or create a default user
            // In a real implementation, you might want to prompt for credentials
            logger_1.logger.info('Authenticating CLI user...');
            // Create or get the CLI user
            const user = await this.authService.createUserIfNotExists(this.state.userId, 'cli-user@example.com', 'CLI User');
            this.state.userId = user.id;
            logger_1.logger.info(`Authenticated as: ${user.name}`);
        }
        catch (error) {
            logger_1.logger.error('Authentication failed:', error);
            throw error;
        }
    }
    async showMainMenu() {
        while (true) {
            try {
                const choice = await this.menuManager.showMainMenu();
                switch (choice) {
                    case 'new_chat':
                        await this.handleNewChat();
                        break;
                    case 'existing_chats':
                        await this.handleExistingChats();
                        break;
                    case 'exit':
                        await this.handleExit();
                        return;
                    default:
                        logger_1.logger.warn('Invalid menu choice');
                }
            }
            catch (error) {
                logger_1.logger.error('Error in main menu:', error);
                // Continue to show menu again
            }
        }
    }
    async handleNewChat() {
        try {
            // Generate a UUID for the chat title automatically
            const chatTitle = `Chat-${Date.now()}`;
            const chat = await this.chatService.createChat(this.state.userId, chatTitle);
            this.state.currentChatId = chat.id;
            this.state.isInChat = true;
            logger_1.logger.info(`Created new chat: ${chatTitle}`);
            await this.chatManager.startChatSession(chat.id, chatTitle);
            this.state.isInChat = false;
            this.state.currentChatId = undefined;
        }
        catch (error) {
            logger_1.logger.error('Error creating new chat:', error);
        }
    }
    async handleExistingChats() {
        try {
            const chats = await this.chatService.getChats(this.state.userId);
            if (chats.length === 0) {
                logger_1.logger.info('No existing chats found.');
                return;
            }
            const choice = await this.menuManager.showExistingChatsMenu(chats);
            if (choice === 'back') {
                return;
            }
            const selectedChat = chats.find(chat => chat.id === choice);
            if (selectedChat) {
                this.state.currentChatId = selectedChat.id;
                this.state.isInChat = true;
                await this.chatManager.startChatSession(selectedChat.id, selectedChat.title);
                this.state.isInChat = false;
                this.state.currentChatId = undefined;
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling existing chats:', error);
        }
    }
    async handleExit() {
        logger_1.logger.info('Exiting CLI...');
        if (this.dbService) {
            await this.dbService.disconnect();
        }
        process.exit(0);
    }
    getState() {
        return { ...this.state };
    }
    updateState(updates) {
        this.state = { ...this.state, ...updates };
    }
}
exports.CLIService = CLIService;
//# sourceMappingURL=CLIService.js.map