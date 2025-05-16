import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex items-center p-4 border-t border-gray-200 bg-white"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-grow px-4 py-2 mr-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="px-4 py-2 font-medium text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-5 h-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
          />
        </svg>
      </button>
    </form>
  );
};

export default MessageInput;