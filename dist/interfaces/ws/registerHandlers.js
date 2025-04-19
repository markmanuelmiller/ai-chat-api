"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebSocketHandlers = void 0;
const ChatMessageHandler_1 = require("./handlers/ChatMessageHandler");
const CreateChatHandler_1 = require("./handlers/CreateChatHandler");
const GetChatsHandler_1 = require("./handlers/GetChatsHandler");
const GetChatMessagesHandler_1 = require("./handlers/GetChatMessagesHandler");
const registerWebSocketHandlers = (wsManager, chatService, aiService) => {
    const registry = wsManager.getHandlerRegistry();
    // Register message handlers
    registry.registerHandler('chat_message', new ChatMessageHandler_1.ChatMessageHandler(aiService));
    registry.registerHandler('create_chat', new CreateChatHandler_1.CreateChatHandler(chatService));
    registry.registerHandler('get_chats', new GetChatsHandler_1.GetChatsHandler(chatService));
    registry.registerHandler('get_chat_messages', new GetChatMessagesHandler_1.GetChatMessagesHandler(chatService));
};
exports.registerWebSocketHandlers = registerWebSocketHandlers;
//# sourceMappingURL=registerHandlers.js.map