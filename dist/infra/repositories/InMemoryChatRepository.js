"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryChatRepository = void 0;
class InMemoryChatRepository {
    constructor() {
        this.chats = new Map();
    }
    async findById(id) {
        return this.chats.get(id) || null;
    }
    async findByUserId(userId) {
        return Array.from(this.chats.values())
            .filter(chat => chat.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async save(chat) {
        this.chats.set(chat.id, chat);
        return chat;
    }
    async delete(id) {
        this.chats.delete(id);
    }
}
exports.InMemoryChatRepository = InMemoryChatRepository;
//# sourceMappingURL=InMemoryChatRepository.js.map