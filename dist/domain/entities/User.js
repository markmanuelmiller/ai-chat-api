"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const Entity_1 = require("@/domain/common/Entity");
const uuid_1 = require("uuid");
class User extends Entity_1.Entity {
    get id() {
        return this.props.id;
    }
    get email() {
        return this.props.email;
    }
    get password() {
        return this.props.password;
    }
    get name() {
        return this.props.name;
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
        return new User(defaultProps);
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map