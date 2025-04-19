"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
const ws_1 = __importDefault(require("ws"));
const jsonwebtoken_1 = require("jsonwebtoken");
const MessageHandlerRegistry_1 = require("./handlers/MessageHandlerRegistry");
const logger_1 = require("@/utils/logger");
class WebSocketManager {
    constructor(server, userRepository, jwtSecret) {
        this.userRepository = userRepository;
        this.jwtSecret = jwtSecret;
        this.clients = new Map();
        this.wss = new ws_1.default.Server({ server });
        this.handlerRegistry = new MessageHandlerRegistry_1.MessageHandlerRegistry();
        this.setup();
    }
    setup() {
        this.wss.on('connection', async (ws, request) => {
            try {
                const token = this.extractTokenFromUrl(request.url);
                if (!token) {
                    ws.close(4001, 'Authentication required');
                    return;
                }
                const decoded = (0, jsonwebtoken_1.verify)(token, this.jwtSecret);
                const user = await this.userRepository.findById(decoded.userId);
                if (!user) {
                    ws.close(4003, 'User not found');
                    return;
                }
                const client = ws;
                client.userId = user.id;
                client.isAlive = true;
                // Add to clients map
                if (!this.clients.has(user.id)) {
                    this.clients.set(user.id, new Set());
                }
                this.clients.get(user.id).add(client);
                // Handle ping/pong for connection health
                ws.on('pong', () => {
                    client.isAlive = true;
                });
                // Handle messages
                ws.on('message', async (message) => {
                    try {
                        const parsedMessage = JSON.parse(message.toString());
                        await this.handleMessage(client, parsedMessage);
                    }
                    catch (error) {
                        logger_1.logger.error('Error handling WebSocket message', error);
                        client.send(JSON.stringify({
                            type: 'error',
                            error: 'Invalid message format',
                        }));
                    }
                });
                // Handle disconnection
                ws.on('close', () => {
                    const userClients = this.clients.get(user.id);
                    if (userClients) {
                        userClients.delete(client);
                        if (userClients.size === 0) {
                            this.clients.delete(user.id);
                        }
                    }
                    logger_1.logger.info(`WebSocket client disconnected: ${user.id}`);
                });
                // Send welcome message
                client.send(JSON.stringify({
                    type: 'connection_established',
                    userId: user.id,
                }));
                logger_1.logger.info(`WebSocket client connected: ${user.id}`);
            }
            catch (error) {
                logger_1.logger.error('Error authenticating WebSocket connection', error);
                ws.close(4002, 'Authentication failed');
            }
        });
        // Heartbeat to detect dead connections
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                const client = ws;
                if (client.isAlive === false) {
                    return client.terminate();
                }
                client.isAlive = false;
                client.ping();
            });
        }, 30000);
    }
    extractTokenFromUrl(url) {
        if (!url)
            return null;
        const match = url.match(/token=([^&]*)/);
        return match ? match[1] : null;
    }
    async handleMessage(client, message) {
        const { type, payload } = message;
        if (!type) {
            client.send(JSON.stringify({
                type: 'error',
                error: 'Message type is required',
            }));
            return;
        }
        const handler = this.handlerRegistry.getHandler(type);
        if (!handler) {
            client.send(JSON.stringify({
                type: 'error',
                error: `Unknown message type: ${type}`,
            }));
            return;
        }
        try {
            await handler.handle(client, payload, this);
        }
        catch (error) {
            logger_1.logger.error(`Error in handler for message type ${type}`, error);
            client.send(JSON.stringify({
                type: 'error',
                error: 'Internal server error',
            }));
        }
    }
    sendToUser(userId, message) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            const messageStr = JSON.stringify(message);
            userClients.forEach(client => {
                if (client.readyState === ws_1.default.OPEN) {
                    client.send(messageStr);
                }
            });
        }
    }
    async sendToAllUsers(message) {
        const messageStr = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(messageStr);
            }
        });
    }
    getHandlerRegistry() {
        return this.handlerRegistry;
    }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=WebSocketManager.js.map