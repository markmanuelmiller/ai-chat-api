"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEventEmitter = void 0;
class DomainEventEmitter {
    constructor() {
        this.handlers = new Map();
    }
    static getInstance() {
        if (!DomainEventEmitter.instance) {
            DomainEventEmitter.instance = new DomainEventEmitter();
        }
        return DomainEventEmitter.instance;
    }
    register(eventType, handler) {
        const handlers = this.handlers.get(eventType) || [];
        handlers.push(handler);
        this.handlers.set(eventType, handlers);
    }
    async emit(event) {
        const handlers = this.handlers.get(event.eventType) || [];
        const promises = handlers.map(handler => handler.handle(event));
        await Promise.all(promises);
    }
}
exports.DomainEventEmitter = DomainEventEmitter;
//# sourceMappingURL=DomainEventEmitter.js.map