# AI Chat API

A TypeScript Node.js server for AI chat applications with WebSockets and LangChain integration.

## Features

- TypeScript Node.js server with hot reloading for development
- Express REST API with JWT authentication
- WebSockets support using the `ws` package for real-time communication
- PostgreSQL database integration
- Clean architecture following SOLID principles
- Domain-Driven Design (DDD) structure
- CQRS pattern with event emitters
- Strategy pattern for WebSocket message handling
- Type-safe events with strong typing
- LangChain and LangGraph integration for AI assistants
- Tests using Jest for unit and integration testing

## Project Structure

```
src/
├── api/               # REST API routes and controllers
├── application/       # Application services and use cases
├── config/            # Configuration settings
├── core/              # Core application logic
├── domain/            # Domain entities, events and repositories
├── infra/             # Infrastructure implementations
├── interfaces/        # Interface adapters (WebSockets)
├── tests/             # Unit and integration tests
└── utils/             # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables by copying `.env.example` to `.env` and updating the values:

```bash
cp .env.example .env
```

4. Create a PostgreSQL database:

```sql
CREATE DATABASE ai_chat;
```

### Development

Run the development server with hot reloading:

```bash
npm run dev
```

### Testing

Run all tests:

```bash
npm test
```

Run unit tests:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

### Building for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

- `GET /api/health` - Server health check

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Chats

- `GET /api/chats` - Get all chats for authenticated user
- `POST /api/chats` - Create a new chat
- `GET /api/chats/:chatId` - Get a specific chat
- `PUT /api/chats/:chatId/title` - Update chat title
- `DELETE /api/chats/:chatId` - Delete a chat
- `GET /api/chats/:chatId/messages` - Get messages for a chat

## WebSocket API

Connect to WebSocket with authentication token:

```
ws://localhost:3000?token=your_jwt_token
```

### Message Types

- `create_chat` - Create a new chat
- `get_chats` - Get all chats for the user
- `get_chat_messages` - Get messages for a specific chat
- `chat_message` - Send a message to the AI

## License

ISC