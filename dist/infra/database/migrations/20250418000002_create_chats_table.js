"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('chats', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('title', 255).defaultTo('Untitled Conversation');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        // Indexes
        table.index('user_id');
    });
}
async function down(knex) {
    return knex.schema.dropTable('chats');
}
//# sourceMappingURL=20250418000002_create_chats_table.js.map