import React from 'react';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, isUser, isStreaming = false }) => {
  return (
    <div 
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`max-w-[80%] px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        } ${isStreaming ? 'border-l-4 border-green-500' : ''}`}
      >
        <p className="text-sm">{content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;