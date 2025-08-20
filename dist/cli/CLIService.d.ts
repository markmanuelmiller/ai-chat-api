import { CLIState } from './types';
export declare class CLIService {
    private authService;
    private chatService;
    private aiService;
    private menuManager;
    private chatManager;
    private inputManager;
    private state;
    private dbService?;
    private storageType;
    constructor(storageType?: string);
    start(): Promise<void>;
    private initializeServices;
    private authenticateUser;
    private showMainMenu;
    private handleNewChat;
    private handleExistingChats;
    private handleExit;
    getState(): CLIState;
    updateState(updates: Partial<CLIState>): void;
}
