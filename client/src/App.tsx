import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import ConnectionStatus from './components/ConnectionStatus';
import { useWebSocket, WebSocketMessage } from './hooks/useWebSocket';

// Default chat ID
const DEFAULT_CHAT_ID = 'e5c466ff-761c-4e6d-9dff-615a32495d28';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  
  // Connect to WebSocket with hardcoded token
  const { isConnected, messages: wsMessages, error, sendMessage } = useWebSocket('ws://localhost:3000?token=abc123');

  // Process incoming WebSocket messages
  useEffect(() => {
    if (wsMessages.length === 0) return;
    
    const lastMessage = wsMessages[wsMessages.length - 1] as WebSocketMessage;
    
    switch (lastMessage.type) {
      case 'message_received':
        // Message received acknowledgment
        setWaitingForResponse(true);
        break;
        
      case 'chat_response_chunk':
        // Handle streaming chunks
        setCurrentResponse(prev => prev + lastMessage.chunk);
        break;
        
      case 'chat_response_complete':
        // Streaming response complete
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            content: currentResponse,
            isUser: false,
          }
        ]);
        setCurrentResponse('');
        setWaitingForResponse(false);
        break;
        
      case 'chat_response_full':
        // Full non-streaming response
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            content: lastMessage.content,
            isUser: false,
          }
        ]);
        setWaitingForResponse(false);
        break;
        
      case 'error':
        // Error handling
        console.error('WebSocket error:', lastMessage.error);
        setWaitingForResponse(false);
        break;
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

  // Display streaming message if there is one
  const displayMessages = [...messages];
  if (currentResponse) {
    displayMessages.push({
      id: 'streaming',
      content: currentResponse,
      isUser: false,
      isStreaming: true,
    });
  }

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