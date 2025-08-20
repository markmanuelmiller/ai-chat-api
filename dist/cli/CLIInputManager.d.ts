export declare class CLIInputManager {
    promptForChatTitle(): Promise<string>;
    promptForMessage(): Promise<string>;
    promptForNewChatTitle(currentTitle: string): Promise<string>;
    promptForConfirmation(message: string, defaultValue?: boolean): Promise<boolean>;
    promptForChoice(message: string, choices: string[]): Promise<string>;
    promptForPassword(message?: string): Promise<string>;
    promptForEmail(): Promise<string>;
    promptForUsername(): Promise<string>;
    waitForEnter(message?: string): Promise<void>;
    isCommand(input: string): boolean;
    parseCommand(input: string): {
        command: string;
        args: string[];
    };
    validateMessageInput(input: string): {
        isValid: boolean;
        error?: string;
    };
    sanitizeInput(input: string): string;
}
