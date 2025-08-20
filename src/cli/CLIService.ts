import { config } from '@/config/config';
import { logger } from '@/utils/logger';

// Repositories
import { DatabaseService } from '@/infra/database/DatabaseService';
import { RepositoryFactory } from '@/infra/repositories/RepositoryFactory';

// Services
import { AuthService } from '@/application/services/AuthService';
import { ChatService } from '@/application/services/ChatService';
import { AIService } from '@/application/services/AIService';
import { JwtService } from '@/infra/auth/JwtService';
import { DomainEventEmitter } from '@/domain/events/DomainEventEmitter';

// CLI Components
import { CLIMenuManager } from './CLIMenuManager';
import { CLIChatManager } from './CLIChatManager';
import { CLIInputManager } from './CLIInputManager';
import { CLIState, CLIOptions } from './types';

export class CLIService {
  private authService!: AuthService;
  private chatService!: ChatService;
  private aiService!: AIService;
  private menuManager!: CLIMenuManager;
  private chatManager!: CLIChatManager;
  private inputManager!: CLIInputManager;
  private state: CLIState;
  private dbService?: DatabaseService;
  private storageType: string;

  constructor(storageType: string = 'memory') {
    this.storageType = storageType;
    this.state = {
      isInChat: false,
      userId: 'cli-user', // Default CLI user ID
    };
  }

  async start(): Promise<void> {
    try {
      await this.initializeServices();
      await this.authenticateUser();
      await this.showMainMenu();
    } catch (error) {
      logger.error('Error in CLI service:', error);
      throw error;
    }
  }

  private async initializeServices(): Promise<void> {
    logger.info('Initializing CLI services...');

    // Initialize database if using PostgreSQL
    if (this.storageType === 'postgres') {
      this.dbService = DatabaseService.getInstance();
      await this.dbService.runMigrations();
      logger.info('Database migrations applied successfully');
    } else {
      logger.info('Using in-memory storage');
    }

    // Setup repositories using factory
    const { userRepository, chatRepository, messageRepository } = RepositoryFactory.createRepositories(
      this.storageType,
      this.dbService
    );

    // Setup domain services
    const jwtService = new JwtService();
    const eventEmitter = DomainEventEmitter.getInstance();

    // Setup application services
    this.authService = new AuthService(userRepository, jwtService);
    this.chatService = new ChatService(chatRepository, messageRepository, eventEmitter);
    
    // Create a mock WebSocket manager for CLI compatibility
    const mockWebSocketManager = {
      getOrCreateQueue: () => ({
        addMessage: () => {}, // No-op for CLI
        close: () => {},
      }),
    };

    this.aiService = new AIService(
      chatRepository,
      messageRepository,
      eventEmitter,
      config,
      mockWebSocketManager as any
    );

    // Initialize CLI components
    this.menuManager = new CLIMenuManager();
    this.chatManager = new CLIChatManager(this.chatService, this.aiService);
    this.inputManager = new CLIInputManager();

    logger.info('CLI services initialized successfully');
  }

  private async authenticateUser(): Promise<void> {
    try {
      // For CLI, we'll use a simple authentication or create a default user
      // In a real implementation, you might want to prompt for credentials
      logger.info('Authenticating CLI user...');
      
      // Create or get the CLI user
      const user = await this.authService.createUserIfNotExists(
        this.state.userId,
        'cli-user@example.com',
        'CLI User'
      );
      
      this.state.userId = user.id;
      logger.info(`Authenticated as: ${user.name}`);
    } catch (error) {
      logger.error('Authentication failed:', error);
      throw error;
    }
  }

  private async showMainMenu(): Promise<void> {
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
            logger.warn('Invalid menu choice');
        }
      } catch (error) {
        logger.error('Error in main menu:', error);
        // Continue to show menu again
      }
    }
  }

  private async handleNewChat(): Promise<void> {
    try {
      // Generate a UUID for the chat title automatically
      const chatTitle = `Chat-${Date.now()}`;
      const chat = await this.chatService.createChat(this.state.userId, chatTitle);
      
      this.state.currentChatId = chat.id;
      this.state.isInChat = true;
      
      logger.info(`Created new chat: ${chatTitle}`);
      await this.chatManager.startChatSession(chat.id, chatTitle);
      
      this.state.isInChat = false;
      this.state.currentChatId = undefined;
    } catch (error) {
      logger.error('Error creating new chat:', error);
    }
  }

  private async handleExistingChats(): Promise<void> {
    try {
      const chats = await this.chatService.getChats(this.state.userId);
      
      if (chats.length === 0) {
        logger.info('No existing chats found.');
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
    } catch (error) {
      logger.error('Error handling existing chats:', error);
    }
  }

  private async handleExit(): Promise<void> {
    logger.info('Exiting CLI...');
    if (this.dbService) {
      await this.dbService.disconnect();
    }
    process.exit(0);
  }

  getState(): CLIState {
    return { ...this.state };
  }

  updateState(updates: Partial<CLIState>): void {
    this.state = { ...this.state, ...updates };
  }
}
