"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRepository = void 0;
class InMemoryUserRepository {
    constructor() {
        this.users = new Map();
    }
    async findById(id) {
        return this.users.get(id) || null;
    }
    async findByEmail(email) {
        return Array.from(this.users.values()).find(user => user.email === email) || null;
    }
    async save(user) {
        this.users.set(user.id, user);
        return user;
    }
    async delete(id) {
        this.users.delete(id);
    }
}
exports.InMemoryUserRepository = InMemoryUserRepository;
//# sourceMappingURL=InMemoryUserRepository.js.map