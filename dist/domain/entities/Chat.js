"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const Entity_1 = require("@/domain/common/Entity");
const uuid_1 = require("uuid");
class Chat extends Entity_1.Entity {
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get title() {
        return this.props.title;
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
        return new Chat(defaultProps);
    }
    updateTitle(title) {
        this.props.title = title;
        this.props.updatedAt = new Date();
    }
}
exports.Chat = Chat;
//# sourceMappingURL=Chat.js.map