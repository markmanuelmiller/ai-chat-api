"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.MessageRole = void 0;
const Entity_1 = require("@/domain/common/Entity");
const uuid_1 = require("uuid");
var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["SYSTEM"] = "system";
})(MessageRole || (exports.MessageRole = MessageRole = {}));
class Message extends Entity_1.Entity {
    get id() {
        return this.props.id;
    }
    get chatId() {
        return this.props.chatId;
    }
    get role() {
        return this.props.role;
    }
    get content() {
        return this.props.content;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    constructor(props) {
        super(props);
    }
    static create(props) {
        const defaultProps = {
            ...props,
            id: props.id ?? (0, uuid_1.v4)(),
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
        return new Message(defaultProps);
    }
}
exports.Message = Message;
//# sourceMappingURL=Message.js.map