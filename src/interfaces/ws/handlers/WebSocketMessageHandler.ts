import { AuthenticatedClient, WebSocketManager } from '../WebSocketManager';

export interface WebSocketMessageHandler {
  handle(client: AuthenticatedClient, payload: any, manager: WebSocketManager): Promise<void>;
}
