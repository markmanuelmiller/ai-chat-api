import WebSocket from 'ws';
import { Server } from 'http';
import { MessageHandlerRegistry } from './handlers/MessageHandlerRegistry';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { StreamingMessageQueue } from '@/core/StreamingMessageQueue';
export interface AuthenticatedClient extends WebSocket {
    userId: string;
    isAlive: boolean;
}
export declare class WebSocketManager {
    private readonly userRepository;
    private readonly jwtSecret;
    private wss;
    private clients;
    private handlerRegistry;
    private sessionQueues;
    constructor(server: Server, userRepository: UserRepository, jwtSecret: string);
    private setup;
    private extractParamFromUrl;
    private handleMessage;
    sendToUser(userId: string, message: any): void;
    sendToAllUsers(message: any): Promise<void>;
    getHandlerRegistry(): MessageHandlerRegistry;
    getOrCreateQueue(sessionId: string): StreamingMessageQueue;
    removeQueue(sessionId: string): void;
    private consumeAndSend;
}
