import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  isConnected: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isConnected }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
      {!isConnected && (
        <div className="flex items-center justify-center h-full">
          <div className="p-4 text-center text-red-500 bg-red-100 rounded-lg">
            <p className="mb-2 font-semibold">Disconnected from server</p>
            <p className="text-sm">Attempting to reconnect...</p>
          </div>
        </div>
      )}
      
      {isConnected && messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="p-4 text-center text-gray-500">
            <p className="mb-2 font-semibold">No messages yet</p>
            <p className="text-sm">Start a conversation by sending a message</p>
          </div>
        </div>
      )}
      
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          content={message.content}
          isUser={message.isUser}
          isStreaming={message.isStreaming}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;