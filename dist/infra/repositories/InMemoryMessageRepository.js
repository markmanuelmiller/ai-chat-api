"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMessageRepository = void 0;
class InMemoryMessageRepository {
    constructor() {
        this.messages = new Map();
    }
    async findById(id) {
        return this.messages.get(id) || null;
    }
    async findByChatId(chatId) {
        return Array.from(this.messages.values())
            .filter(message => message.chatId === chatId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    async save(message) {
        this.messages.set(message.id, message);
        return message;
    }
    async delete(id) {
        this.messages.delete(id);
    }
}
exports.InMemoryMessageRepository = InMemoryMessageRepository;
//# sourceMappingURL=InMemoryMessageRepository.js.map