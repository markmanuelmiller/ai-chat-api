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

export class CLIInputManager {
  async promptForChatTitle(): Promise<string> {
    const inq = await getInquirer();
    const { title } = await inq.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Enter a title for your new chat:',
        default: 'New Conversation',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Chat title cannot be empty';
          }
          if (input.length > 100) {
            return 'Chat title must be less than 100 characters';
          }
          return true;
        }
      }
    ]);

    return title.trim();
  }

  async promptForMessage(): Promise<string> {
    const inq = await getInquirer();
    const chalkInstance = await getChalk();
    const { message } = await inq.prompt([
      {
        type: 'input',
        name: 'message',
        message: chalkInstance.cyan('👤 You:') + chalkInstance.gray(' (type /exit to return to main menu)'),
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Message cannot be empty';
          }
          return true;
        }
      }
    ]);

    return message.trim();
  }

  async promptForNewChatTitle(currentTitle: string): Promise<string> {
    const inq = await getInquirer();
    const { title } = await inq.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Enter new title for the chat:',
        default: currentTitle,
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Chat title cannot be empty';
          }
          if (input.length > 100) {
            return 'Chat title must be less than 100 characters';
          }
          return true;
        }
      }
    ]);

    return title.trim();
  }

  async promptForConfirmation(message: string, defaultValue: boolean = false): Promise<boolean> {
    const inq = await getInquirer();
    const { confirm } = await inq.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message,
        default: defaultValue
      }
    ]);

    return confirm;
  }

  async promptForChoice(message: string, choices: string[]): Promise<string> {
    const inq = await getInquirer();
    const { choice } = await inq.prompt([
      {
        type: 'list',
        name: 'choice',
        message,
        choices
      }
    ]);

    return choice;
  }

  async promptForPassword(message: string = 'Enter password:'): Promise<string> {
    const inq = await getInquirer();
    const { password } = await inq.prompt([
      {
        type: 'password',
        name: 'password',
        message,
        mask: '*',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Password cannot be empty';
          }
          if (input.length < 6) {
            return 'Password must be at least 6 characters long';
          }
          return true;
        }
      }
    ]);

    return password;
  }

  async promptForEmail(): Promise<string> {
    const inq = await getInquirer();
    const { email } = await inq.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email:',
        validate: (input: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            return 'Please enter a valid email address';
          }
          return true;
        }
      }
    ]);

    return email.trim();
  }

  async promptForUsername(): Promise<string> {
    const inq = await getInquirer();
    const { username } = await inq.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter username:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Username cannot be empty';
          }
          if (input.length < 3) {
            return 'Username must be at least 3 characters long';
          }
          if (input.length > 20) {
            return 'Username must be less than 20 characters';
          }
          return true;
        }
      }
    ]);

    return username.trim();
  }

  async waitForEnter(message: string = 'Press Enter to continue...'): Promise<void> {
    const inq = await getInquirer();
    await inq.prompt([
      {
        type: 'input',
        name: 'continue',
        message,
      }
    ]);
  }

  isCommand(input: string): boolean {
    return input.startsWith('/');
  }

  parseCommand(input: string): { command: string; args: string[] } {
    const parts = input.slice(1).split(' ').filter(part => part.trim());
    const command = parts[0]?.toLowerCase() || '';
    const args = parts.slice(1);
    
    return { command, args };
  }

  validateMessageInput(input: string): { isValid: boolean; error?: string } {
    if (!input.trim()) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    
    if (input.length > 10000) {
      return { isValid: false, error: 'Message is too long (max 10,000 characters)' };
    }
    
    return { isValid: true };
  }

  sanitizeInput(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }
}
