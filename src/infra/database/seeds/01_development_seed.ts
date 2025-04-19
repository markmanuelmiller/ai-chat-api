import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '@/utils/password';

export async function seed(knex: Knex): Promise<void> {
  // Only run seeds in development environment
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Deletes ALL existing entries
  await knex('messages').del();
  await knex('chats').del();
  await knex('users').del();

  // Create test user
  const userId = uuidv4();
  const hashedPassword = await hashPassword('password123');
  
  await knex('users').insert({
    id: userId,
    email: 'test@example.com',
    password: hashedPassword,
    name: 'Test User',
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Create sample chats
  const chatId1 = uuidv4();
  const chatId2 = uuidv4();
  
  await knex('chats').insert([
    {
      id: chatId1,
      user_id: userId,
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
      id: uuidv4(),
      chat_id: chatId1,
      role: 'system',
      content: 'You are a helpful AI assistant.',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      chat_id: chatId1,
      role: 'user',
      content: 'Hello! Can you help me get started with this chat app?',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      chat_id: chatId1,
      role: 'assistant',
      content: 'Of course! I\'d be happy to help you get started with this chat application. What would you like to know?',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      chat_id: chatId2,
      role: 'system',
      content: 'You are a helpful AI assistant specializing in technical topics.',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      chat_id: chatId2,
      role: 'user',
      content: 'What is the difference between REST and GraphQL?',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      chat_id: chatId2,
      role: 'assistant',
      content: 'REST and GraphQL are both APIs for accessing data, but they have different approaches. REST uses multiple endpoints with fixed data structures, while GraphQL uses a single endpoint with a flexible query language that allows clients to request exactly the data they need. This can reduce over-fetching and under-fetching of data that commonly occurs in REST APIs.',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}