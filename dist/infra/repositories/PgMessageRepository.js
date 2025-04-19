"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgMessageRepository = void 0;
const Message_1 = require("@/domain/entities/Message");
class PgMessageRepository {
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query('SELECT * FROM messages WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapToEntity(result.rows[0]);
    }
    async findByChatId(chatId) {
        const result = await this.db.query('SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC', [chatId]);
        return result.rows.map(row => this.mapToEntity(row));
    }
    async save(message) {
        const { id, chatId, role, content, createdAt, updatedAt } = message;
        const exists = await this.findById(id);
        if (exists) {
            const result = await this.db.query('UPDATE messages SET content = $1, updated_at = $2 WHERE id = $3 RETURNING *', [content, updatedAt, id]);
            return this.mapToEntity(result.rows[0]);
        }
        const result = await this.db.query('INSERT INTO messages (id, chat_id, role, content, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [id, chatId, role, content, createdAt, updatedAt]);
        return this.mapToEntity(result.rows[0]);
    }
    async delete(id) {
        await this.db.query('DELETE FROM messages WHERE id = $1', [id]);
    }
    mapToEntity(raw) {
        return Message_1.Message.create({
            id: raw.id,
            chatId: raw.chat_id,
            role: raw.role,
            content: raw.content,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at,
        });
    }
}
exports.PgMessageRepository = PgMessageRepository;
//# sourceMappingURL=PgMessageRepository.js.map