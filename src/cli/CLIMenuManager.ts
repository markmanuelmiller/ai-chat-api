import { Chat } from '@/domain/entities/Chat';
import { MainMenuOption, ChatMenuOption } from './types';
import { logger } from '@/utils/logger';

// Dynamic imports for ES modules
let inquirer: any;
let chalk: any;

async function getInquirer() {
  if (!inquirer) {
    inquirer = await import('inquirer');
  }
  return inquirer.default || inquirer;
}

async function getChalk() {
  if (!chalk) {
    chalk = await import('chalk');
  }
  return chalk.default || chalk;
}

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
    await this.displayHeader();
    
    const inq = await getInquirer();
    const { choice } = await inq.prompt([
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
    await this.displayHeader();
    
    if (chats.length === 0) {
      const chalkInstance = await getChalk();
      console.log(chalkInstance.yellow('No existing chats found.'));
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

    const inq = await getInquirer();
    const choices = [
      ...chatOptions.map(option => ({
        name: option.name,
        value: option.value
      })),
      new inq.Separator(),
      {
        name: '⬅️  Back to Main Menu',
        value: 'back'
      }
    ];

    const { choice } = await inq.prompt([
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
    const inq = await getInquirer();
    const { action } = await inq.prompt([
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
          new inq.Separator(),
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
    const inq = await getInquirer();
    const { confirm } = await inq.prompt([
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
    const inq = await getInquirer();
    await inq.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...',
      }
    ]);
  }

  private async displayHeader(): Promise<void> {
    const chalkInstance = await getChalk();
    console.log(chalkInstance.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalkInstance.blue.bold('║                    AI Chat CLI                              ║'));
    console.log(chalkInstance.blue.bold('║              Powered by LangGraph                           ║'));
    console.log(chalkInstance.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
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

  async displayChatHistory(messages: any[]): Promise<void> {
    const chalkInstance = await getChalk();
    console.log(chalkInstance.green.bold('\n📜 Chat History:'));
    console.log(chalkInstance.gray('─'.repeat(80)));
    
    if (messages.length === 0) {
      console.log(chalkInstance.yellow('No messages yet. Start the conversation!'));
      return;
    }

    messages.forEach(message => {
      const timestamp = this.formatDate(message.createdAt);
      const role = message.role === 'user' ? '👤 You' : '🤖 AI';
      const color = message.role === 'user' ? chalkInstance.cyan : chalkInstance.magenta;
      
      console.log(chalkInstance.gray(`[${timestamp}] ${role}:`));
      console.log(color(message.content));
      console.log(chalkInstance.gray('─'.repeat(80)));
    });
  }

  async displayWelcomeMessage(chatTitle: string): Promise<void> {
    const chalkInstance = await getChalk();
    console.log(chalkInstance.green.bold(`\n🎉 Welcome to "${chatTitle}"!`));
    console.log(chalkInstance.gray('Type your message below or use commands:'));
    console.log(chalkInstance.cyan('  /exit') + chalkInstance.gray(' - Exit this chat and return to main menu'));
    console.log(chalkInstance.cyan('  /help') + chalkInstance.gray(' - Show all available commands'));
    console.log(chalkInstance.gray('─'.repeat(80)));
  }

  async displayHelp(): Promise<void> {
    const chalkInstance = await getChalk();
    console.log(chalkInstance.yellow.bold('\n📖 Available Commands:'));
    console.log(chalkInstance.gray('─'.repeat(50)));
    console.log(chalkInstance.cyan('/exit') + ' - ' + chalkInstance.green('Exit this chat and return to main menu'));
    console.log(chalkInstance.cyan('/help') + ' - Show this help message');
    console.log(chalkInstance.cyan('/clear') + ' - Clear the chat history display');
    console.log(chalkInstance.cyan('/history') + ' - Show chat history');
    console.log(chalkInstance.cyan('/rename') + ' - Rename the current chat');
    console.log(chalkInstance.cyan('/delete') + ' - Delete the current chat');
    console.log(chalkInstance.gray('─'.repeat(50)));
    console.log(chalkInstance.yellow('💡 Tip: Type /exit anytime to return to the main menu!'));
  }
}
