export interface CLIOptions {
  verbose?: boolean;
  storage?: 'memory' | 'postgres';
  port?: number;
}

export interface ChatSession {
  chatId: string;
  title: string;
  createdAt: Date;
  lastMessageAt?: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MainMenuOption {
  name: string;
  value: string;
  description: string;
}

export interface ChatMenuOption {
  name: string;
  value: string;
  chatId: string;
  title: string;
  lastMessageAt?: Date;
}

export enum CLICommand {
  NEW_CHAT = 'new_chat',
  EXISTING_CHATS = 'existing_chats',
  EXIT = 'exit',
  BACK = 'back',
  CONTINUE_CHAT = 'continue_chat',
  DELETE_CHAT = 'delete_chat',
  RENAME_CHAT = 'rename_chat'
}

export interface CLIState {
  currentChatId?: string;
  isInChat: boolean;
  userId: string;
}
