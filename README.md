# AI Chat API

A Node.js/TypeScript API for AI-powered chat functionality with WebSocket support, LangChain integration, and PostgreSQL database.

## Features

- **AI Chat**: Interactive chat with AI using LangChain and LangGraph
- **WebSocket Support**: Real-time communication
- **Authentication**: JWT-based authentication
- **Database**: PostgreSQL with Knex.js ORM
- **Stream Doctor**: Advanced log analysis for video streaming systems
- **Docker Support**: Containerized deployment
- **CLI Interface**: Command-line interface for testing

## Prerequisites

- Node.js 18+
- PostgreSQL (optional, can use in-memory storage)
- Docker and Docker Compose (for containerized deployment)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-chat-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

## Docker Development

### Quick Start with Docker

1. **Build and start the services**:
```bash
docker-compose up -d --build
```

2. **Access the API**:
- API: http://localhost:3001
- Mock Server: http://localhost:3003

### Mock Logs for Development

The application includes support for local mock binary logs for testing the Stream Doctor functionality:

1. **Setup Mock Logs**:
```bash
# The mock-logs directory is already created with the proper structure
ls -la mock-logs/binlog/
# active/  done/
```

2. **Add Sample Data**:
```bash
# Copy your binary log files to the mock directories
cp your_logs/*.bin mock-logs/binlog/active/
cp your_completed_logs/*.bin mock-logs/binlog/done/
```

3. **Configure Environment**:
```bash
# In your .env file
LOCAL_LOGS_PATH=./mock-logs
```

4. **Run with Docker**:
```bash
docker-compose up -d
```

The mock logs will be mounted to `/var/log/foundation` inside the container, allowing the Stream Doctor Graph to analyze them just like real production logs.

### Environment Variables

Key environment variables for Docker development:

- `LOCAL_LOGS_PATH`: Path to local mock logs directory (default: `./mock-logs`)
- `STORAGE_TYPE`: Database type (`memory` or `postgres`)
- `PORT`: API server port (default: `3001`)

## Database

### Migrations

The project uses Knex.js for managing database migrations.

- Run all pending migrations: `npm run migrate`
- Create a new migration: `npm run migrate:make migration_name`
- Rollback the last batch of migrations: `npm run migrate:rollback`

Migration files are stored in `src/infra/database/migrations`.

### Database Seeding

The project includes seed data for development purposes.

- Run database seeds: `npm run seed`

Seed files are stored in `src/infra/database/seeds`.

### Database Reset

To reset the database (useful during development):

```bash
npm run db:reset
```

This will rollback all migrations, reapply them, and seed the database.

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