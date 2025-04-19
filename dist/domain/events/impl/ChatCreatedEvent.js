"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCreatedEvent = void 0;
class ChatCreatedEvent {
    constructor(aggregateId, userId) {
        this.aggregateId = aggregateId;
        this.userId = userId;
        this.eventType = 'chat.created';
        this.timestamp = new Date();
    }
}
exports.ChatCreatedEvent = ChatCreatedEvent;
//# sourceMappingURL=ChatCreatedEvent.js.map