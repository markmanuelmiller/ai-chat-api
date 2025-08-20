"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('email', 255).unique().notNullable();
        table.string('password', 255).notNullable();
        table.string('name', 255).notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        // Indexes
        table.index('email');
    });
}
async function down(knex) {
    return knex.schema.dropTable('users');
}
//# sourceMappingURL=20250418000001_create_users_table.js.map