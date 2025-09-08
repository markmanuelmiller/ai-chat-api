import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import ConnectionStatus from './components/ConnectionStatus';
import { useWebSocket } from './hooks/useWebSocket';

// Default chat ID
const DEFAULT_CHAT_ID = '123e4567-e89b-12d3-a456-426614174001';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
  isError?: boolean;
  isMarkdown?: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  
  // Connect to WebSocket with hardcoded token and now, chatId
  const webSocketUrl = `ws://localhost:3000?token=abc123&chatId=${encodeURIComponent(DEFAULT_CHAT_ID)}`;
  const { isConnected, messages: wsMessages, error, sendMessage } = useWebSocket(webSocketUrl);

  // Process incoming WebSocket messages
  useEffect(() => {
    if (wsMessages.length === 0) return;

    // Assuming wsMessages from useWebSocket are already JSON.parsed
    // and conform to our StreamableMessage structure from the backend.
    const lastMessage = wsMessages[wsMessages.length - 1]; 

    // Ensure lastMessage and lastMessage.type are defined
    if (!lastMessage || typeof lastMessage.type !== 'string') {
      console.warn('Received WebSocket message without a valid type:', lastMessage);
      return;
    }

    console.log('Client received WS message:', lastMessage); // Good for debugging all messages

    switch (lastMessage.type) {
      case 'connection_established':
        console.log('Connection established for chat:', lastMessage.chatId);
        break;

      case 'message_received':
        setWaitingForResponse(true);
        break;

      case 'error':
        console.error('WebSocket error:', lastMessage.payload.message);
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            content: `Error: ${lastMessage.payload.message}`,
            isUser: false,
            isError: true,
          },
        ]);
        setWaitingForResponse(false);
        break;

      case 'GRAPH_MESSAGE':
        if (lastMessage.payload && typeof lastMessage.payload.message === 'string') {
          const graphMsgContent = `${lastMessage.payload.node}: ${lastMessage.payload.message}`;
          console.log('Graph Message:', graphMsgContent);
          setMessages(prev => [
            ...prev,
            {
              id: uuidv4(),
              content: graphMsgContent,
              isUser: false,
            },
          ]);
        }
        break;

      case 'NODE_OUTPUT':
        if (lastMessage.payload && typeof lastMessage.payload.message === 'string') {
          console.log('Node Output Received:', lastMessage.payload);
          setMessages(prev => [
            ...prev,
            {
              id: uuidv4(),
              content: lastMessage.payload.message,
              isUser: false,
              isMarkdown: true,
            },
          ]);
        }
        break;

      case 'ERROR':
        if (lastMessage.payload && typeof lastMessage.payload.message === 'string') {
          console.error('Graph error:', lastMessage.payload);
          setMessages(prev => [
            ...prev,
            {
              id: uuidv4(),
              content: lastMessage.payload.message,
              isUser: false,
              isError: true,
            },
          ]);
        }
        setWaitingForResponse(false);
        break;

      default:
        console.warn('Received unhandled WebSocket message type:', lastMessage.type, lastMessage);
    }
  }, [wsMessages]);

  // Send a new message
  const handleSendMessage = useCallback((content: string) => {
    if (!isConnected) return;
    
    // Add user message to UI
    setMessages(prev => [
      ...prev,
      {
        id: uuidv4(),
        content,
        isUser: true,
      }
    ]);
    
    // Send message to server
    sendMessage(DEFAULT_CHAT_ID, content);
  }, [isConnected, sendMessage]);

  // Display messages
  const displayMessages = [...messages];

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 bg-blue-600 text-white">
        <h1 className="text-xl font-bold">AI Chat</h1>
      </header>
      
      <ConnectionStatus isConnected={isConnected} error={error} />
      
      <ChatWindow 
        messages={displayMessages}
        isConnected={isConnected} 
      />
      
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={!isConnected || waitingForResponse} 
      />
    </div>
  );
}

export default App;