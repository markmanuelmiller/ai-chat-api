import inquirer from 'inquirer';
import chalk from 'chalk';
import { Chat } from '@/domain/entities/Chat';
import { MainMenuOption, ChatMenuOption } from './types';
import { logger } from '@/utils/logger';

export class CLIMenuManager {
  private mainMenuOptions: MainMenuOption[] = [
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

  async showMainMenu(): Promise<string> {
    console.clear();
    this.displayHeader();
    
    const { choice } = await inquirer.prompt([
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

  async showExistingChatsMenu(chats: Chat[]): Promise<string> {
    console.clear();
    this.displayHeader();
    
    if (chats.length === 0) {
      console.log(chalk.yellow('No existing chats found.'));
      await this.pressAnyKeyToContinue();
      return 'back';
    }

    const chatOptions: ChatMenuOption[] = chats.map(chat => ({
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
      new inquirer.Separator(),
      {
        name: '⬅️  Back to Main Menu',
        value: 'back'
      }
    ];

    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Select a chat to continue:',
        choices
      }
    ]);

    return choice;
  }

  async showChatActionsMenu(chatId: string, chatTitle: string): Promise<string> {
    const { action } = await inquirer.prompt([
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
          new inquirer.Separator(),
          {
            name: '⬅️  Back',
            value: 'back'
          }
        ]
      }
    ]);

    return action;
  }

  async confirmDeleteChat(chatTitle: string): Promise<boolean> {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`,
        default: false
      }
    ]);

    return confirm;
  }

  async pressAnyKeyToContinue(): Promise<void> {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...',
      }
    ]);
  }

  private displayHeader(): void {
    console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║                    AI Chat CLI                              ║'));
    console.log(chalk.blue.bold('║              Powered by LangGraph                           ║'));
    console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
    console.log('');
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }

  displayChatHistory(messages: any[]): void {
    console.log(chalk.green.bold('\n📜 Chat History:'));
    console.log(chalk.gray('─'.repeat(80)));
    
    if (messages.length === 0) {
      console.log(chalk.yellow('No messages yet. Start the conversation!'));
      return;
    }

    messages.forEach(message => {
      const timestamp = this.formatDate(message.createdAt);
      const role = message.role === 'user' ? '👤 You' : '🤖 AI';
      const color = message.role === 'user' ? chalk.cyan : chalk.magenta;
      
      console.log(chalk.gray(`[${timestamp}] ${role}:`));
      console.log(color(message.content));
      console.log(chalk.gray('─'.repeat(80)));
    });
  }

  displayWelcomeMessage(chatTitle: string): void {
    console.log(chalk.green.bold(`\n🎉 Welcome to "${chatTitle}"!`));
    console.log(chalk.gray('Type your message below or use commands:'));
    console.log(chalk.cyan('  /exit') + chalk.gray(' - Exit this chat and return to main menu'));
    console.log(chalk.cyan('  /help') + chalk.gray(' - Show all available commands'));
    console.log(chalk.gray('─'.repeat(80)));
  }

  displayHelp(): void {
    console.log(chalk.yellow.bold('\n📖 Available Commands:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('/exit') + ' - ' + chalk.green('Exit this chat and return to main menu'));
    console.log(chalk.cyan('/help') + ' - Show this help message');
    console.log(chalk.cyan('/clear') + ' - Clear the chat history display');
    console.log(chalk.cyan('/history') + ' - Show chat history');
    console.log(chalk.cyan('/rename') + ' - Rename the current chat');
    console.log(chalk.cyan('/delete') + ' - Delete the current chat');
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.yellow('💡 Tip: Type /exit anytime to return to the main menu!'));
  }
}
