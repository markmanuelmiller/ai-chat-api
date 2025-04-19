"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
class Entity {
    constructor(props) {
        this.props = props;
    }
    equals(entity) {
        if (entity === null || entity === undefined) {
            return false;
        }
        if (this === entity) {
            return true;
        }
        return JSON.stringify(this.props) === JSON.stringify(entity.props);
    }
}
exports.Entity = Entity;
//# sourceMappingURL=Entity.js.map