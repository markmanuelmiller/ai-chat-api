"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIMenuManager = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
class CLIMenuManager {
    constructor() {
        this.mainMenuOptions = [
            {
                name: '💬 Create New Chat',
                value: 'new_chat',
                description: 'Start a new conversation'
            },
            {
                name: '📚 Access Existing Chats',
                value: 'existing_chats',
                description: 'View and continue previous conversations'
            },
            {
                name: '🚪 Exit',
                value: 'exit',
                description: 'Exit the application'
            }
        ];
    }
    async showMainMenu() {
        console.clear();
        this.displayHeader();
        const { choice } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'choice',
                message: 'What would you like to do?',
                choices: this.mainMenuOptions.map(option => ({
                    name: `${option.name} - ${option.description}`,
                    value: option.value
                }))
            }
        ]);
        return choice;
    }
    async showExistingChatsMenu(chats) {
        console.clear();
        this.displayHeader();
        if (chats.length === 0) {
            console.log(chalk_1.default.yellow('No existing chats found.'));
            await this.pressAnyKeyToContinue();
            return 'back';
        }
        const chatOptions = chats.map(chat => ({
            name: `${chat.title} (${this.formatDate(chat.createdAt)})`,
            value: chat.id,
            chatId: chat.id,
            title: chat.title,
            lastMessageAt: chat.updatedAt
        }));
        const choices = [
            ...chatOptions.map(option => ({
                name: option.name,
                value: option.value
            })),
            new inquirer_1.default.Separator(),
            {
                name: '⬅️  Back to Main Menu',
                value: 'back'
            }
        ];
        const { choice } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'choice',
                message: 'Select a chat to continue:',
                choices
            }
        ]);
        return choice;
    }
    async showChatActionsMenu(chatId, chatTitle) {
        const { action } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: `Actions for "${chatTitle}":`,
                choices: [
                    {
                        name: '💬 Continue Chat',
                        value: 'continue_chat'
                    },
                    {
                        name: '✏️  Rename Chat',
                        value: 'rename_chat'
                    },
                    {
                        name: '🗑️  Delete Chat',
                        value: 'delete_chat'
                    },
                    new inquirer_1.default.Separator(),
                    {
                        name: '⬅️  Back',
                        value: 'back'
                    }
                ]
            }
        ]);
        return action;
    }
    async confirmDeleteChat(chatTitle) {
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`,
                default: false
            }
        ]);
        return confirm;
    }
    async pressAnyKeyToContinue() {
        await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'continue',
                message: 'Press Enter to continue...',
            }
        ]);
    }
    displayHeader() {
        console.log(chalk_1.default.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.blue.bold('║                    AI Chat CLI                              ║'));
        console.log(chalk_1.default.blue.bold('║              Powered by LangGraph                           ║'));
        console.log(chalk_1.default.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
        console.log('');
    }
    formatDate(date) {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 1) {
            return 'Just now';
        }
        else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        }
        else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    }
    displayChatHistory(messages) {
        console.log(chalk_1.default.green.bold('\n📜 Chat History:'));
        console.log(chalk_1.default.gray('─'.repeat(80)));
        if (messages.length === 0) {
            console.log(chalk_1.default.yellow('No messages yet. Start the conversation!'));
            return;
        }
        messages.forEach(message => {
            const timestamp = this.formatDate(message.createdAt);
            const role = message.role === 'user' ? '👤 You' : '🤖 AI';
            const color = message.role === 'user' ? chalk_1.default.cyan : chalk_1.default.magenta;
            console.log(chalk_1.default.gray(`[${timestamp}] ${role}:`));
            console.log(color(message.content));
            console.log(chalk_1.default.gray('─'.repeat(80)));
        });
    }
    displayWelcomeMessage(chatTitle) {
        console.log(chalk_1.default.green.bold(`\n🎉 Welcome to "${chatTitle}"!`));
        console.log(chalk_1.default.gray('Type your message below or use commands:'));
        console.log(chalk_1.default.cyan('  /exit') + chalk_1.default.gray(' - Exit this chat and return to main menu'));
        console.log(chalk_1.default.cyan('  /help') + chalk_1.default.gray(' - Show all available commands'));
        console.log(chalk_1.default.gray('─'.repeat(80)));
    }
    displayHelp() {
        console.log(chalk_1.default.yellow.bold('\n📖 Available Commands:'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('/exit') + ' - ' + chalk_1.default.green('Exit this chat and return to main menu'));
        console.log(chalk_1.default.cyan('/help') + ' - Show this help message');
        console.log(chalk_1.default.cyan('/clear') + ' - Clear the chat history display');
        console.log(chalk_1.default.cyan('/history') + ' - Show chat history');
        console.log(chalk_1.default.cyan('/rename') + ' - Rename the current chat');
        console.log(chalk_1.default.cyan('/delete') + ' - Delete the current chat');
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.yellow('💡 Tip: Type /exit anytime to return to the main menu!'));
    }
}
exports.CLIMenuManager = CLIMenuManager;
//# sourceMappingURL=CLIMenuManager.js.map