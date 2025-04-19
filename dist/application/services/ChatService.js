"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const Chat_1 = require("@/domain/entities/Chat");
const Message_1 = require("@/domain/entities/Message");
const ChatCreatedEvent_1 = require("@/domain/events/impl/ChatCreatedEvent");
const MessageCreatedEvent_1 = require("@/domain/events/impl/MessageCreatedEvent");
class ChatService {
    constructor(chatRepository, messageRepository, eventEmitter) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        this.eventEmitter = eventEmitter;
    }
    async createChat(userId, title) {
        const chat = Chat_1.Chat.create({
            userId,
            title,
        });
        const savedChat = await this.chatRepository.save(chat);
        await this.eventEmitter.emit(new ChatCreatedEvent_1.ChatCreatedEvent(savedChat.id, userId));
        return savedChat;
    }
    async getChats(userId) {
        return this.chatRepository.findByUserId(userId);
    }
    async getChatById(chatId) {
        return this.chatRepository.findById(chatId);
    }
    async updateChatTitle(chatId, title) {
        const chat = await this.chatRepository.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }
        chat.updateTitle(title);
        return this.chatRepository.save(chat);
    }
    async deleteChat(chatId) {
        await this.chatRepository.delete(chatId);
    }
    async getMessages(chatId) {
        return this.messageRepository.findByChatId(chatId);
    }
    async addMessage(chatId, role, content) {
        const chat = await this.chatRepository.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }
        const message = Message_1.Message.create({
            chatId,
            role,
            content,
        });
        const savedMessage = await this.messageRepository.save(message);
        await this.eventEmitter.emit(new MessageCreatedEvent_1.MessageCreatedEvent(savedMessage.id, chatId, role, content));
        return savedMessage;
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=ChatService.js.map