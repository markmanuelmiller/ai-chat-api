import { ChatService } from '@/application/services/ChatService';
import { AIService } from '@/application/services/AIService';
import { CLIMenuManager } from './CLIMenuManager';
import { CLIInputManager } from './CLIInputManager';
export declare class CLIChatManager {
    private chatService;
    private aiService;
    private menuManager;
    private inputManager;
    constructor(chatService: ChatService, aiService: AIService, menuManager?: CLIMenuManager, inputManager?: CLIInputManager);
    startChatSession(chatId: string, chatTitle: string): Promise<void>;
    private chatLoop;
    private handleCommand;
    private processUserMessage;
    private displayChatHistory;
    private renameChat;
    createNewChat(userId: string): Promise<string>;
    listUserChats(userId: string): Promise<any[]>;
    getChatById(chatId: string): Promise<any>;
    deleteChat(chatId: string): Promise<void>;
}
