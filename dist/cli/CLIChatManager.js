"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIChatManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
const CLIMenuManager_1 = require("./CLIMenuManager");
const CLIInputManager_1 = require("./CLIInputManager");
const logger_1 = require("@/utils/logger");
class CLIChatManager {
    constructor(chatService, aiService, menuManager = new CLIMenuManager_1.CLIMenuManager(), inputManager = new CLIInputManager_1.CLIInputManager()) {
        this.chatService = chatService;
        this.aiService = aiService;
        this.menuManager = menuManager;
        this.inputManager = inputManager;
    }
    async startChatSession(chatId, chatTitle) {
        try {
            console.clear();
            this.menuManager.displayWelcomeMessage(chatTitle);
            // Load and display chat history
            const messages = await this.chatService.getMessages(chatId);
            this.menuManager.displayChatHistory(messages);
            // Start the chat loop
            await this.chatLoop(chatId, chatTitle);
        }
        catch (error) {
            logger_1.logger.error('Error starting chat session:', error);
            console.log(chalk_1.default.red('Error starting chat session. Please try again.'));
        }
    }
    async chatLoop(chatId, chatTitle) {
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
                    console.log(chalk_1.default.red(`Error: ${validation.error}`));
                    continue;
                }
                // Process the message with AI only if it's not a command
                await this.processUserMessage(chatId, userInput);
            }
            catch (error) {
                logger_1.logger.error('Error in chat loop:', error);
                console.log(chalk_1.default.red('An error occurred. Please try again.'));
            }
        }
    }
    async handleCommand(command, chatId, chatTitle) {
        const { command: cmd, args } = this.inputManager.parseCommand(command);
        switch (cmd) {
            case 'help':
                this.menuManager.displayHelp();
                return true;
            case 'exit':
                console.log(chalk_1.default.yellow('👋 Exiting chat and returning to main menu...'));
                console.log(chalk_1.default.gray('─'.repeat(80)));
                return false;
            case 'clear':
                console.clear();
                this.menuManager.displayWelcomeMessage(chatTitle);
                return true;
            case 'history':
                await this.displayChatHistory(chatId);
                return true;
            case 'rename':
                await this.renameChat(chatId, chatTitle);
                return true;
            case 'delete':
                const shouldDelete = await this.inputManager.promptForConfirmation(`Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`);
                if (shouldDelete) {
                    await this.chatService.deleteChat(chatId);
                    console.log(chalk_1.default.green('Chat deleted successfully.'));
                    return false;
                }
                return true;
            default:
                console.log(chalk_1.default.red(`Unknown command: ${cmd}. Type /help for available commands.`));
                return true;
        }
    }
    async processUserMessage(chatId, userMessage) {
        try {
            console.log(chalk_1.default.gray('🤖 AI is thinking...'));
            // Generate AI response
            const aiResponse = await this.aiService.generateResponse(chatId, userMessage);
            // Display the response
            console.log(chalk_1.default.magenta('🤖 AI:'));
            console.log(chalk_1.default.magenta(aiResponse.content));
            console.log(chalk_1.default.gray('─'.repeat(80)));
        }
        catch (error) {
            logger_1.logger.error('Error processing user message:', error);
            console.log(chalk_1.default.red('Error: Failed to get AI response. Please try again.'));
        }
    }
    async displayChatHistory(chatId) {
        try {
            const messages = await this.chatService.getMessages(chatId);
            this.menuManager.displayChatHistory(messages);
        }
        catch (error) {
            logger_1.logger.error('Error displaying chat history:', error);
            console.log(chalk_1.default.red('Error: Failed to load chat history.'));
        }
    }
    async renameChat(chatId, currentTitle) {
        try {
            const newTitle = await this.inputManager.promptForNewChatTitle(currentTitle);
            if (newTitle !== currentTitle) {
                await this.chatService.updateChatTitle(chatId, newTitle);
                console.log(chalk_1.default.green(`Chat renamed to: "${newTitle}"`));
            }
        }
        catch (error) {
            logger_1.logger.error('Error renaming chat:', error);
            console.log(chalk_1.default.red('Error: Failed to rename chat.'));
        }
    }
    async createNewChat(userId) {
        try {
            const chatTitle = `Chat-${Date.now()}`;
            const chat = await this.chatService.createChat(userId, chatTitle);
            console.log(chalk_1.default.green(`Created new chat: "${chatTitle}"`));
            return chat.id;
        }
        catch (error) {
            logger_1.logger.error('Error creating new chat:', error);
            throw error;
        }
    }
    async listUserChats(userId) {
        try {
            return await this.chatService.getChats(userId);
        }
        catch (error) {
            logger_1.logger.error('Error listing user chats:', error);
            throw error;
        }
    }
    async getChatById(chatId) {
        try {
            return await this.chatService.getChatById(chatId);
        }
        catch (error) {
            logger_1.logger.error('Error getting chat by ID:', error);
            throw error;
        }
    }
    async deleteChat(chatId) {
        try {
            await this.chatService.deleteChat(chatId);
            console.log(chalk_1.default.green('Chat deleted successfully.'));
        }
        catch (error) {
            logger_1.logger.error('Error deleting chat:', error);
            throw error;
        }
    }
}
exports.CLIChatManager = CLIChatManager;
//# sourceMappingURL=CLIChatManager.js.map