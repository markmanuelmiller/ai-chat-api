import { WebSocketMessageHandler } from './WebSocketMessageHandler';
export declare class MessageHandlerRegistry {
    private handlers;
    registerHandler(type: string, handler: WebSocketMessageHandler): void;
    getHandler(type: string): WebSocketMessageHandler | undefined;
    getAllHandlers(): Map<string, WebSocketMessageHandler>;
}
