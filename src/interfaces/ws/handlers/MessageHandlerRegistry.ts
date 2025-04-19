import { WebSocketMessageHandler } from './WebSocketMessageHandler';

export class MessageHandlerRegistry {
  private handlers: Map<string, WebSocketMessageHandler> = new Map();

  registerHandler(type: string, handler: WebSocketMessageHandler): void {
    this.handlers.set(type, handler);
  }

  getHandler(type: string): WebSocketMessageHandler | undefined {
    return this.handlers.get(type);
  }

  getAllHandlers(): Map<string, WebSocketMessageHandler> {
    return this.handlers;
  }
}
