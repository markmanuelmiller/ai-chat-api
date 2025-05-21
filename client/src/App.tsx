import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import ConnectionStatus from './components/ConnectionStatus';
import { useWebSocket, WebSocketMessage } from './hooks/useWebSocket';

// Default chat ID
const DEFAULT_CHAT_ID = '123e4567-e89b-12d3-a456-426614174001';

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
      case 'message_received': // This is a custom ack from ChatMessageHandler
        setWaitingForResponse(true);
        break;

      case 'STREAM_START':
        console.log('Stream started:', lastMessage.payload);
        setCurrentResponse(''); 
        setWaitingForResponse(true);
        break;

      case 'GRAPH_MESSAGE':
        if (lastMessage.payload && typeof lastMessage.payload.message === 'string') {
          const graphMsg = `[${lastMessage.payload.node || 'Graph'}]: ${lastMessage.payload.message}\n`;
          console.log('Graph Message:', graphMsg);
          // Uncomment below if you want these in the main chat bubble
          // setCurrentResponse(prev => prev + graphMsg);
        }
        break;

      case 'LLM_CHUNK':
        if (lastMessage.payload && typeof lastMessage.payload.chunk === 'string') {
          setCurrentResponse(prev => prev + lastMessage.payload.chunk);
        }
        break;

      case 'NODE_OUTPUT':
        console.log('Node Output Received:', lastMessage.payload);
        // Example: append a small notification for testing
        // if (lastMessage.payload && lastMessage.payload.node) {
        //   setCurrentResponse(prev => prev + `[Node: ${lastMessage.payload.node} processed.]\n`);
        // }
        break;

      case 'NODE_SKIPPED_OR_EMPTY':
        console.log('Node Skipped or Empty:', lastMessage.payload);
        // if (lastMessage.payload && lastMessage.payload.node) {
        //    setCurrentResponse(prev => prev + `[Node: ${lastMessage.payload.node} - no output.]\n`);
        // }
        break;

      case 'ERROR': 
        console.error('Error message from backend stream:', lastMessage.payload);
        if (lastMessage.payload && typeof lastMessage.payload.error === 'string') {
          setCurrentResponse(prev =>
            prev +
            `\n**ERROR:** ${lastMessage.payload.error}${lastMessage.payload.details ? ` - ${lastMessage.payload.details}` : ''}\n`
          );
        }
        setWaitingForResponse(false);
        break;

      case 'STREAM_END':
        console.log('Stream ended. Final accumulated response:', currentResponse, 'Payload:', lastMessage.payload);
        
        if (currentResponse.trim() || (lastMessage.payload && typeof lastMessage.payload.finalResponse === 'string' && lastMessage.payload.finalResponse.trim())) {
          setMessages(prev => [
            ...prev,
            {
              id: uuidv4(),
              content: (lastMessage.payload && typeof lastMessage.payload.finalResponse === 'string' && lastMessage.payload.finalResponse.trim()) 
                       ? lastMessage.payload.finalResponse 
                       : currentResponse.trim(),
              isUser: false,
            },
          ]);
        } else if (lastMessage.payload && typeof lastMessage.payload.message === 'string') {
             setMessages(prev => [
                ...prev,
                {
                id: uuidv4(),
                content: `[System: ${lastMessage.payload.message}]`,
                isUser: false,
                },
            ]);
        }
        
        setCurrentResponse('');
        setWaitingForResponse(false);
        break;

      case 'chat_response_full': // For non-streaming responses
        if (lastMessage.payload && typeof lastMessage.payload.content === 'string') { // Assuming payload.content for full
            setMessages(prev => [
            ...prev,
            {
                id: uuidv4(),
                content: lastMessage.payload.content, // Adjusted to look inside payload for consistency
                isUser: false,
            },
            ]);
        }
        setWaitingForResponse(false);
        break;
      
      case 'chat_response_chunk': // Deprecated by LLM_CHUNK
      case 'chat_response_complete': // Deprecated by STREAM_END
        console.warn(`Received deprecated WebSocket message type: ${lastMessage.type}`, lastMessage);
        break;

      default:
        console.warn('Received unhandled WebSocket message type:', lastMessage.type, lastMessage);
    }
  }, [wsMessages, currentResponse]); // Added currentResponse to dependency array

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