"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const uuid_1 = require("uuid");
const password_1 = require("../../../utils/password");
async function seed(knex) {
    // Only run seeds in development environment
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    // Deletes ALL existing entries
    await knex('messages').del();
    await knex('chats').del();
    await knex('users').del();
    // Create test user
    const userId = (0, uuid_1.v4)();
    const hashedPassword = await (0, password_1.hashPassword)('password123');
    await knex('users').insert({
        id: userId,
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        created_at: new Date(),
        updated_at: new Date(),
    });
    await knex('users').insert({
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: 'mark@miller.com',
        password: hashedPassword,
        name: 'Mark Miller',
        created_at: new Date(),
        updated_at: new Date(),
    });
    // Create sample chats
    const chatId1 = "123e4567-e89b-12d3-a456-426614174001"; // Hardcoded UUID for consistent testing
    const chatId2 = (0, uuid_1.v4)();
    await knex('chats').insert([
        {
            id: chatId1,
            user_id: "123e4567-e89b-12d3-a456-426614174000", // Use the hardcoded user ID
            title: 'Getting Started Chat',
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: chatId2,
            user_id: userId,
            title: 'Technical Questions',
            created_at: new Date(),
            updated_at: new Date(),
        },
    ]);
    // Create sample messages
    await knex('messages').insert([
        {
            id: (0, uuid_1.v4)(),
            chat_id: chatId1,
            role: 'system',
            content: 'You are a helpful AI assistant.',
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: (0, uuid_1.v4)(),
            chat_id: chatId1,
            role: 'user',
            content: 'Hello! Can you help me get started with this chat app?',
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: (0, uuid_1.v4)(),
            chat_id: chatId1,
            role: 'assistant',
            content: 'Of course! I\'d be happy to help you get started with this chat application. What would you like to know?',
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: (0, uuid_1.v4)(),
            chat_id: chatId2,
            role: 'system',
            content: 'You are a helpful AI assistant specializing in technical topics.',
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: (0, uuid_1.v4)(),
            chat_id: chatId2,
            role: 'user',
            content: 'What is the difference between REST and GraphQL?',
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: (0, uuid_1.v4)(),
            chat_id: chatId2,
            role: 'assistant',
            content: 'REST and GraphQL are both APIs for accessing data, but they have different approaches. REST uses multiple endpoints with fixed data structures, while GraphQL uses a single endpoint with a flexible query language that allows clients to request exactly the data they need. This can reduce over-fetching and under-fetching of data that commonly occurs in REST APIs.',
            created_at: new Date(),
            updated_at: new Date(),
        },
    ]);
}
//# sourceMappingURL=01_development_seed.js.map