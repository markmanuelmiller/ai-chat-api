"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgChatRepository = void 0;
const Chat_1 = require("@/domain/entities/Chat");
class PgChatRepository {
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query('SELECT * FROM chats WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapToEntity(result.rows[0]);
    }
    async findByUserId(userId) {
        const result = await this.db.query('SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC', [
            userId,
        ]);
        return result.rows.map(this.mapToEntity);
    }
    async save(chat) {
        const { id, userId, title, createdAt, updatedAt } = chat;
        const exists = await this.findById(id);
        if (exists) {
            const result = await this.db.query('UPDATE chats SET title = $1, updated_at = $2 WHERE id = $3 RETURNING *', [title, updatedAt, id]);
            return this.mapToEntity(result.rows[0]);
        }
        const result = await this.db.query('INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *', [id, userId, title, createdAt, updatedAt]);
        return this.mapToEntity(result.rows[0]);
    }
    async delete(id) {
        await this.db.query('DELETE FROM chats WHERE id = $1', [id]);
    }
    mapToEntity(raw) {
        return Chat_1.Chat.create({
            id: raw.id,
            userId: raw.user_id,
            title: raw.title,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at,
        });
    }
}
exports.PgChatRepository = PgChatRepository;
//# sourceMappingURL=PgChatRepository.js.map