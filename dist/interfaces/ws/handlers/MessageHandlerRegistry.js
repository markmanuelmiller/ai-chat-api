"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandlerRegistry = void 0;
class MessageHandlerRegistry {
    constructor() {
        this.handlers = new Map();
    }
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }
    getHandler(type) {
        return this.handlers.get(type);
    }
    getAllHandlers() {
        return this.handlers;
    }
}
exports.MessageHandlerRegistry = MessageHandlerRegistry;
//# sourceMappingURL=MessageHandlerRegistry.js.map