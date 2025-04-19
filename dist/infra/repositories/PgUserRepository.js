"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgUserRepository = void 0;
const User_1 = require("@/domain/entities/User");
class PgUserRepository {
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapToEntity(result.rows[0]);
    }
    async findByEmail(email) {
        const result = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapToEntity(result.rows[0]);
    }
    async save(user) {
        const { id, email, password, name, createdAt, updatedAt } = user;
        const exists = await this.findById(id);
        if (exists) {
            const result = await this.db.query('UPDATE users SET email = $1, password = $2, name = $3, updated_at = $4 WHERE id = $5 RETURNING *', [email, password, name, updatedAt, id]);
            return this.mapToEntity(result.rows[0]);
        }
        const result = await this.db.query('INSERT INTO users (id, email, password, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [id, email, password, name, createdAt, updatedAt]);
        return this.mapToEntity(result.rows[0]);
    }
    async delete(id) {
        await this.db.query('DELETE FROM users WHERE id = $1', [id]);
    }
    mapToEntity(raw) {
        return User_1.User.create({
            id: raw.id,
            email: raw.email,
            password: raw.password,
            name: raw.name,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at,
        });
    }
}
exports.PgUserRepository = PgUserRepository;
//# sourceMappingURL=PgUserRepository.js.map