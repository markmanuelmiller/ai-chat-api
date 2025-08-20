import { Chat } from '@/domain/entities/Chat';
export declare class CLIMenuManager {
    private mainMenuOptions;
    showMainMenu(): Promise<string>;
    showExistingChatsMenu(chats: Chat[]): Promise<string>;
    showChatActionsMenu(chatId: string, chatTitle: string): Promise<string>;
    confirmDeleteChat(chatTitle: string): Promise<boolean>;
    pressAnyKeyToContinue(): Promise<void>;
    private displayHeader;
    private formatDate;
    displayChatHistory(messages: any[]): void;
    displayWelcomeMessage(chatTitle: string): void;
    displayHelp(): void;
}
