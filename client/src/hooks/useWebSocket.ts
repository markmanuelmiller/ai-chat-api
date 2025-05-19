import { useState, useEffect, useCallback, useRef } from 'react';

// Define types for the websocket messages
export interface ChatMessage {
  type: 'chat_message';
  payload: {
    chatId: string;
    message: string;
    stream?: boolean;
  };
}

export interface MessageReceived {
  type: 'message_received';
  chatId: string;
}

export interface ChatResponseChunk {
  type: 'chat_response_chunk';
  chatId: string;
  chunk: string;
}

export interface ChatResponseComplete {
  type: 'chat_response_complete';
  chatId: string;
}

export interface ChatResponseFull {
  type: 'chat_response_full';
  chatId: string;
  content: string;
}

export interface ErrorMessage {
  type: 'error';
  error: string;
}

export type WebSocketMessage = 
  | ChatMessage
  | MessageReceived
  | ChatResponseChunk
  | ChatResponseComplete
  | ChatResponseFull
  | ErrorMessage;

// Custom hook for WebSocket connection
export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!url) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        if (data.type === 'error') {
          setError(data.error);
        } else {
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [url]);

  // Send message function
  const sendMessage = useCallback((chatId: string, message: string, stream: boolean = true) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected');
      return;
    }

    const chatMessage: ChatMessage = {
      type: 'chat_message',
      payload: {
        chatId,
        message,
        stream
      }
    };

    wsRef.current.send(JSON.stringify(chatMessage));
  }, []);

  return {
    isConnected,
    messages,
    error,
    sendMessage
  };
};