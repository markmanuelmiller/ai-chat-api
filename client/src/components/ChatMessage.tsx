import React from 'react';

interface ChatMessageProps {
  content: React.ReactNode;
  isUser: boolean;
  isStreaming?: boolean;
  isError?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, isUser, isStreaming = false, isError = false }) => {
  return (
    <div 
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`max-w-[80%] px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : isError 
              ? 'bg-red-100 text-red-800 border border-red-300 rounded-bl-none'
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
        } ${isStreaming ? 'border-l-4 border-green-500' : ''}`}
      >
        {content}
      </div>
    </div>
  );
};

export default ChatMessage;