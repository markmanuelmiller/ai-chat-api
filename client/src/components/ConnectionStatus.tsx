import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, error }) => {
  return (
    <div className="px-4 py-2 text-sm text-center text-white bg-gray-800">
      {isConnected ? (
        <span className="flex items-center justify-center">
          <span className="inline-block w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
          Connected to server
        </span>
      ) : (
        <span className="flex items-center justify-center">
          <span className="inline-block w-2 h-2 mr-2 bg-red-500 rounded-full"></span>
          {error || 'Disconnected from server'}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;