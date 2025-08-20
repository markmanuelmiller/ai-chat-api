"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIInputManager = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
class CLIInputManager {
    async promptForChatTitle() {
        const { title } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter a title for your new chat:',
                default: 'New Conversation',
                validate: (input) => {
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
    async promptForMessage() {
        const { message } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'message',
                message: chalk_1.default.cyan('👤 You:') + chalk_1.default.gray(' (type /exit to return to main menu)'),
                validate: (input) => {
                    if (!input.trim()) {
                        return 'Message cannot be empty';
                    }
                    return true;
                }
            }
        ]);
        return message.trim();
    }
    async promptForNewChatTitle(currentTitle) {
        const { title } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter new title for the chat:',
                default: currentTitle,
                validate: (input) => {
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
    async promptForConfirmation(message, defaultValue = false) {
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message,
                default: defaultValue
            }
        ]);
        return confirm;
    }
    async promptForChoice(message, choices) {
        const { choice } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'choice',
                message,
                choices
            }
        ]);
        return choice;
    }
    async promptForPassword(message = 'Enter password:') {
        const { password } = await inquirer_1.default.prompt([
            {
                type: 'password',
                name: 'password',
                message,
                mask: '*',
                validate: (input) => {
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
    async promptForEmail() {
        const { email } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Enter your email:',
                validate: (input) => {
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
    async promptForUsername() {
        const { username } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'username',
                message: 'Enter username:',
                validate: (input) => {
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
    async waitForEnter(message = 'Press Enter to continue...') {
        await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'continue',
                message,
            }
        ]);
    }
    isCommand(input) {
        return input.startsWith('/');
    }
    parseCommand(input) {
        const parts = input.slice(1).split(' ').filter(part => part.trim());
        const command = parts[0]?.toLowerCase() || '';
        const args = parts.slice(1);
        return { command, args };
    }
    validateMessageInput(input) {
        if (!input.trim()) {
            return { isValid: false, error: 'Message cannot be empty' };
        }
        if (input.length > 10000) {
            return { isValid: false, error: 'Message is too long (max 10,000 characters)' };
        }
        return { isValid: true };
    }
    sanitizeInput(input) {
        return input.trim().replace(/\s+/g, ' ');
    }
}
exports.CLIInputManager = CLIInputManager;
//# sourceMappingURL=CLIInputManager.js.map