"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('messages', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('chat_id').notNullable().references('id').inTable('chats').onDelete('CASCADE');
        table.enum('role', ['user', 'assistant', 'system']).notNullable();
        table.text('content').notNullable();
        table.jsonb('metadata');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        // Indexes
        table.index('chat_id');
        table.index('role');
    });
}
async function down(knex) {
    return knex.schema.dropTable('messages');
}
//# sourceMappingURL=20250418000003_create_messages_table.js.map