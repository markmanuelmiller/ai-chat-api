# AI Chat Client

A simple and elegant React frontend for the AI Chat API WebSocket server.

## Features

- Real-time communication with AI Chat API via WebSockets
- Clean, responsive UI with Tailwind CSS
- Support for streaming and non-streaming AI responses
- Visual connection status indicators
- TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- AI Chat API server running on localhost:3000

### Installation

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The client will be available at [http://localhost:5173](http://localhost:5173)

### From Root Directory

You can also start the client from the project root directory:

```
npm run client
```

## Usage

1. Make sure the AI Chat API server is running
2. Open the client in your browser
3. Start chatting with the AI!

## WebSocket Message Types

The client handles the following WebSocket message types:

- `chat_message`: Send a message to the AI
- `message_received`: Acknowledgment from the server
- `chat_response_chunk`: Streaming response chunk
- `chat_response_complete`: Streaming response completed
- `chat_response_full`: Full non-streaming response
- `error`: Error message from the server