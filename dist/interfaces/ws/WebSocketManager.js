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
const StreamingMessageQueue_1 = require("@/core/StreamingMessageQueue");
class WebSocketManager {
    constructor(server, userRepository, jwtSecret) {
        this.userRepository = userRepository;
        this.jwtSecret = jwtSecret;
        this.clients = new Map();
        this.sessionQueues = new Map();
        this.wss = new ws_1.default.Server({ server });
        this.handlerRegistry = new MessageHandlerRegistry_1.MessageHandlerRegistry();
        this.setup();
    }
    setup() {
        this.wss.on('connection', async (ws, request) => {
            const connectionId = request.headers['sec-websocket-key']; // For easier log tracking per connection
            logger_1.logger.info(`[WS Conn: ${connectionId}] New WebSocket connection attempt.`);
            try {
                const token = this.extractParamFromUrl(request.url, 'token');
                logger_1.logger.debug(`[WS Conn: ${connectionId}] Extracted token: ${token}`);
                if (!token) {
                    logger_1.logger.warn(`[WS Conn: ${connectionId}] Closing: Authentication token required.`);
                    ws.close(4001, 'Authentication token required');
                    return;
                }
                const chatId = this.extractParamFromUrl(request.url, 'chatId');
                logger_1.logger.info(`[WS Conn: ${connectionId}] Extracted chatId from URL: ${chatId}`);
                if (!chatId) {
                    logger_1.logger.warn(`[WS Conn: ${connectionId}] WebSocket connection has no chatId in URL. Will connect, but chat-specific streaming needs chatId.`);
                }
                // Backdoor for testing: accept "abc123" as a valid token
                let userId;
                if (token === 'abc123') {
                    // Use a fixed user ID for the backdoor token
                    // uuidv4()
                    userId = '123e4567-e89b-12d3-a456-426614174000';
                    logger_1.logger.info('Backdoor authentication used');
                }
                else {
                    // Normal JWT verification
                    const decoded = (0, jsonwebtoken_1.verify)(token, this.jwtSecret);
                    userId = decoded.userId;
                }
                // For normal authentication, verify the user exists
                let user;
                if (token !== 'abc123') {
                    user = await this.userRepository.findById(userId);
                    if (!user) {
                        ws.close(4003, 'User not found');
                        return;
                    }
                }
                else {
                    // For backdoor, we don't need to verify user existence
                    user = { id: userId };
                }
                const client = ws;
                client.userId = user.id;
                client.isAlive = true;
                logger_1.logger.info(`[WS Conn: ${connectionId}] Client authenticated: userId ${user.id}`);
                // Add to clients map (keyed by userId)
                if (!this.clients.has(user.id)) {
                    this.clients.set(user.id, new Set());
                }
                this.clients.get(user.id).add(client);
                // Start consuming messages from the session's queue for this client
                if (chatId) {
                    logger_1.logger.info(`[WS Conn: ${connectionId}] Associating with chatId: ${chatId}`);
                    const sessionQueue = this.getOrCreateQueue(chatId); // Use chatId as sessionId
                    logger_1.logger.debug(`[WS Conn: ${connectionId}] Got queue for chatId ${chatId}. Is new: ${!this.sessionQueues.has(chatId) || this.sessionQueues.get(chatId) !== sessionQueue}. Starting consumeAndSend.`);
                    this.consumeAndSend(client, sessionQueue, chatId, connectionId);
                }
                else {
                    logger_1.logger.info(`[WS Conn: ${connectionId}] Client ${user.id} connected without a specific chatId. No chat-specific stream will be initiated automatically.`);
                }
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
                    logger_1.logger.info(`[WS Conn: ${connectionId}] WebSocket client disconnected: userId ${user.id}, chatId (if associated): ${chatId || 'N/A'}`);
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
    extractParamFromUrl(url, paramName) {
        if (!url)
            return null;
        const regex = new RegExp(`[?&]${paramName}=([^&]*)`);
        const match = url.match(regex);
        return match ? decodeURIComponent(match[1]) : null;
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
    getOrCreateQueue(sessionId) {
        const existingQueue = this.sessionQueues.get(sessionId);
        if (existingQueue && !existingQueue.isClosed()) {
            // An open queue already exists for this session. 
            // This might indicate concurrent streams for the same ID, or a client reconnecting to an active stream.
            // For now, we'll return it. If strict one-stream-per-session is needed, this logic might change.
            logger_1.logger.warn(`[QueueManager] Returning existing OPEN queue for session: ${sessionId}. Concurrent stream or reconnect?`);
            return existingQueue;
        }
        if (existingQueue && existingQueue.isClosed()) {
            logger_1.logger.info(`[QueueManager] Existing queue for session ${sessionId} was closed. Replacing with a new one.`);
            // Optionally, explicitly remove it first, though .set will overwrite.
            // this.sessionQueues.delete(sessionId);
        }
        // If no queue exists, or if the existing one was closed, create and store a new one.
        logger_1.logger.info(`[QueueManager] Creating new StreamingMessageQueue for session: ${sessionId}`);
        const newQueue = new StreamingMessageQueue_1.StreamingMessageQueue();
        this.sessionQueues.set(sessionId, newQueue);
        return newQueue;
    }
    removeQueue(sessionId) {
        const queue = this.sessionQueues.get(sessionId);
        if (queue) {
            if (!queue.isClosed()) {
                logger_1.logger.warn(`[QueueManager] Closing queue for session ${sessionId} before removal as it was not closed.`);
                queue.close();
            }
            this.sessionQueues.delete(sessionId);
            logger_1.logger.info(`[QueueManager] Removed StreamingMessageQueue for session: ${sessionId}`);
        }
        else {
            logger_1.logger.debug(`[QueueManager] Attempted to remove queue for non-existent session: ${sessionId}`);
        }
    }
    async consumeAndSend(client, queue, streamId, connectionId) {
        logger_1.logger.info(`[ConsumeSend SID: ${streamId} ConnID: ${connectionId}] Starting to consume messages for client ${client.userId}.`);
        try {
            while (client.readyState === ws_1.default.OPEN) {
                logger_1.logger.debug(`[ConsumeSend SID: ${streamId} ConnID: ${connectionId}] Waiting for message from queue...`);
                const message = await queue.getMessage();
                if (message) {
                    logger_1.logger.info(`[ConsumeSend SID: ${streamId} ConnID: ${connectionId}] Dequeued message: ${JSON.stringify(message)}. Client readyState: ${client.readyState}. Attempting to send.`);
                    if (client.readyState === ws_1.default.OPEN) {
                        client.send(JSON.stringify(message));
                        logger_1.logger.debug(`[ConsumeSend SID: ${streamId} ConnID: ${connectionId}] Message sent to client ${client.userId}.`);
                    }
                    else {
                        logger_1.logger.warn(`[ConsumeSend SID: ${streamId} ConnID: ${connectionId}] Client ${client.userId} not in OPEN state (${client.readyState}). Message not sent. Re-queuing is not implemented; message might be lost for this client.`);
                        // If messages must not be lost, you might consider putting them back in a queue or persisting them.
                        // However, for real-time streams, if client is closed, usually messages are dropped.
                    }
                }
                else {
                    logger_1.logger.info(`[ConsumeSend SID: ${streamId} ConnID: ${connectionId}] Message queue returned null. Stream ended or queue closed for client ${client.userId}.`);
                    break;
                }
            }
        }
        catch (error) {
            const castError = error;
            logger_1.logger.error(`[ConsumeSend SID: ${streamId} ConnID: ${connectionId}] Error for client ${client.userId}: ${castError.message}`, castError.stack);
            if (client.readyState === ws_1.default.OPEN) {
                client.send(JSON.stringify({
                    type: 'STREAM_ERROR',
                    payload: { streamId: streamId, error: 'Error consuming message stream.', details: castError.message }
                }));
            }
        }
        finally {
            logger_1.logger.info(`[ConsumeSend SID: ${streamId} ConnID: ${connectionId}] Stopped consuming messages for client ${client.userId}.`);
        }
    }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=WebSocketManager.js.map