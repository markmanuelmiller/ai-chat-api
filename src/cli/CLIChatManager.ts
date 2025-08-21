import { ChatService } from '@/application/services/ChatService';
import { AIService } from '@/application/services/AIService';
import { CLIMenuManager } from './CLIMenuManager';
import { CLIInputManager } from './CLIInputManager';
import { MessageRole } from '@/domain/entities/Message';
import { logger } from '@/utils/logger';

// Dynamic import for chalk ES module
let chalk: any;

async function getChalk() {
  if (!chalk) {
    chalk = await import('chalk');
  }
  return chalk.default || chalk;
}

export class CLIChatManager {
  constructor(
    private chatService: ChatService,
    private aiService: AIService,
    private menuManager: CLIMenuManager = new CLIMenuManager(),
    private inputManager: CLIInputManager = new CLIInputManager()
  ) {}

  async startChatSession(chatId: string, chatTitle: string): Promise<void> {
    try {
      console.clear();
      await this.menuManager.displayWelcomeMessage(chatTitle);
      
      // Load and display chat history
      const messages = await this.chatService.getMessages(chatId);
      await this.menuManager.displayChatHistory(messages);
      
      // Start the chat loop
      await this.chatLoop(chatId, chatTitle);
      
    } catch (error) {
      logger.error('Error starting chat session:', error);
      const chalkInstance = await getChalk();
      console.log(chalkInstance.red('Error starting chat session. Please try again.'));
    }
  }

  private async chatLoop(chatId: string, chatTitle: string): Promise<void> {
    while (true) {
      try {
        const userInput = await this.inputManager.promptForMessage();
        
        // Check if it's a command first - don't send commands to AI
        if (this.inputManager.isCommand(userInput)) {
          const shouldContinue = await this.handleCommand(userInput, chatId, chatTitle);
          if (!shouldContinue) {
            break;
          }
          continue;
        }

        // Validate the message
        const validation = this.inputManager.validateMessageInput(userInput);
        if (!validation.isValid) {
          const chalkInstance = await getChalk();
          console.log(chalkInstance.red(`Error: ${validation.error}`));
          continue;
        }

        // Process the message with AI only if it's not a command
        await this.processUserMessage(chatId, userInput);
        
      } catch (error) {
        logger.error('Error in chat loop:', error);
        const chalkInstance = await getChalk();
        console.log(chalkInstance.red('An error occurred. Please try again.'));
      }
    }
  }

  private async handleCommand(command: string, chatId: string, chatTitle: string): Promise<boolean> {
    const { command: cmd, args } = this.inputManager.parseCommand(command);
    const chalkInstance = await getChalk();
    
    switch (cmd) {
      case 'help':
        await this.menuManager.displayHelp();
        return true;
        
      case 'exit':
        console.log(chalkInstance.yellow('👋 Exiting chat and returning to main menu...'));
        console.log(chalkInstance.gray('─'.repeat(80)));
        return false;
        
      case 'clear':
        console.clear();
        await this.menuManager.displayWelcomeMessage(chatTitle);
        return true;
        
      case 'history':
        await this.displayChatHistory(chatId);
        return true;
        
      case 'rename':
        await this.renameChat(chatId, chatTitle);
        return true;
        
      case 'delete':
        const shouldDelete = await this.inputManager.promptForConfirmation(
          `Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`
        );
        if (shouldDelete) {
          await this.chatService.deleteChat(chatId);
          console.log(chalkInstance.green('Chat deleted successfully.'));
          return false;
        }
        return true;
        
      default:
        console.log(chalkInstance.red(`Unknown command: ${cmd}. Type /help for available commands.`));
        return true;
    }
  }

  private async processUserMessage(chatId: string, userMessage: string): Promise<void> {
    try {
      const chalkInstance = await getChalk();
      console.log(chalkInstance.gray('🤖 AI is thinking...'));
      
      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(chatId, userMessage);
      
      // Display the response
      console.log(chalkInstance.magenta('🤖 AI:'));
      console.log(chalkInstance.magenta(aiResponse.content));
      console.log(chalkInstance.gray('─'.repeat(80)));
      
    } catch (error) {
      logger.error('Error processing user message:', error);
      const chalkInstance = await getChalk();
      console.log(chalkInstance.red('Error: Failed to get AI response. Please try again.'));
    }
  }

  private async displayChatHistory(chatId: string): Promise<void> {
    try {
      const messages = await this.chatService.getMessages(chatId);
      await this.menuManager.displayChatHistory(messages);
    } catch (error) {
      logger.error('Error displaying chat history:', error);
      const chalkInstance = await getChalk();
      console.log(chalkInstance.red('Error: Failed to load chat history.'));
    }
  }

  private async renameChat(chatId: string, currentTitle: string): Promise<void> {
    try {
      const newTitle = await this.inputManager.promptForNewChatTitle(currentTitle);
      
      if (newTitle !== currentTitle) {
        await this.chatService.updateChatTitle(chatId, newTitle);
        const chalkInstance = await getChalk();
        console.log(chalkInstance.green(`Chat renamed to: "${newTitle}"`));
      }
    } catch (error) {
      logger.error('Error renaming chat:', error);
      const chalkInstance = await getChalk();
      console.log(chalkInstance.red('Error: Failed to rename chat.'));
    }
  }

  async createNewChat(userId: string): Promise<string> {
    try {
      const chatTitle = `Chat-${Date.now()}`;
      const chat = await this.chatService.createChat(userId, chatTitle);
      
      const chalkInstance = await getChalk();
      console.log(chalkInstance.green(`Created new chat: "${chatTitle}"`));
      return chat.id;
    } catch (error) {
      logger.error('Error creating new chat:', error);
      throw error;
    }
  }

  async listUserChats(userId: string): Promise<any[]> {
    try {
      return await this.chatService.getChats(userId);
    } catch (error) {
      logger.error('Error listing user chats:', error);
      throw error;
    }
  }

  async getChatById(chatId: string): Promise<any> {
    try {
      return await this.chatService.getChatById(chatId);
    } catch (error) {
      logger.error('Error getting chat by ID:', error);
      throw error;
    }
  }

  async deleteChat(chatId: string): Promise<void> {
    try {
      await this.chatService.deleteChat(chatId);
      const chalkInstance = await getChalk();
      console.log(chalkInstance.green('Chat deleted successfully.'));
    } catch (error) {
      logger.error('Error deleting chat:', error);
      throw error;
    }
  }
}
