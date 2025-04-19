"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageCreatedEvent = void 0;
class MessageCreatedEvent {
    constructor(aggregateId, chatId, role, content) {
        this.aggregateId = aggregateId;
        this.chatId = chatId;
        this.role = role;
        this.content = content;
        this.eventType = 'message.created';
        this.timestamp = new Date();
    }
}
exports.MessageCreatedEvent = MessageCreatedEvent;
//# sourceMappingURL=MessageCreatedEvent.js.map