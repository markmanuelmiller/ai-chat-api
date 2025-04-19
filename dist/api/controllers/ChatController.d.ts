import { Response } from 'express';
import { ChatService } from '@/application/services/ChatService';
import { AuthenticatedRequest } from '@/api/middleware/authMiddleware';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    createChat: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getChats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getChatById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    updateChatTitle: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    deleteChat: (req: AuthenticatedRequest, res: Response) => Promise<void>;
    getChatMessages: (req: AuthenticatedRequest, res: Response) => Promise<void>;
}
