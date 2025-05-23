import { useState, useEffect, useCallback, useRef } from 'react';

// --- Define DebugParams (can be in a shared types file too) ---
export interface DebugParams {
  start?: string;
  end?: string;
  timezone?: string;
  streamType?: string;
  streamStatus?: string;
  streamError?: string;
  streamErrorDescription?: string;
}

// Define types for the websocket messages
export interface ChatMessage {
  type: 'chat_message';
  sessionId?: string; // Optional: depending on whether your backend expects/uses it for this type
  payload: {
    chatId: string;
    message: string;
    stream?: boolean;
  };
}

export interface MessageReceived {
  type: 'message_received';
  sessionId?: string;
  chatId: string;
}

export interface ChatResponseChunk {
  type: 'chat_response_chunk';
  sessionId?: string;
  chatId: string; // Or payload: { chunk: string } if that's the structure
  chunk: string;
}

export interface ChatResponseComplete {
  type: 'chat_response_complete';
  sessionId?: string;
  chatId: string;
}

export interface ChatResponseFull {
  type: 'chat_response_full';
  sessionId?: string;
  chatId: string;
  payload: { // Assuming payload wraps content
    content: string;
  };
}

export interface ErrorMessage {
  type: 'error';
  sessionId?: string;
  error?: string; // Making error optional if payload contains it
  payload?: {
    error: string;
    details?: string;
  };
}

// --- New/Updated types for graph streaming and HITL ---
export interface StreamStartMessage {
  type: 'STREAM_START';
  sessionId: string;
  payload?: { message?: string };
}

export interface GraphMessage {
  type: 'GRAPH_MESSAGE';
  sessionId: string;
  payload: { node?: string; message: string };
}

export interface LLMChunkMessage {
  type: 'LLM_CHUNK';
  sessionId: string;
  payload: { node?: string; chunk: string; fullReportSnapshot?: string };
}

export interface NodeOutputMessage {
  type: 'NODE_OUTPUT';
  sessionId: string;
  payload: { node: string; data: any };
}

export interface NodeSkippedOrEmptyMessage {
  type: 'NODE_SKIPPED_OR_EMPTY';
  sessionId: string;
  payload: { node: string; message?: string };
}

export interface StreamEndMessage {
  type: 'STREAM_END';
  sessionId: string;
  payload?: { message?: string; finalResponse?: string };
}

export interface HitlRequiredMessage {
  type: 'HITL_REQUIRED';
  sessionId: string;
  payload: { node: string; debugParams: DebugParams; resumeState: any; };
}

export interface ResumeAckMessage {
  type: 'resume_ack';
  sessionId: string;
  payload?: { message?: string };
}
// --- End New Types ---

export type WebSocketMessage =
  | ChatMessage
  | MessageReceived
  | ChatResponseChunk
  | ChatResponseComplete
  | ChatResponseFull
  | ErrorMessage
  // New types
  | StreamStartMessage
  | GraphMessage
  | LLMChunkMessage
  | NodeOutputMessage
  | NodeSkippedOrEmptyMessage
  | StreamEndMessage
  | HitlRequiredMessage
  | ResumeAckMessage;
  

// Custom hook for WebSocket connection
export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]); // Use the new comprehensive type
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
      // Consider extracting more specific error info if available
      setError('WebSocket connection error'); 
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as WebSocketMessage; // Assert to new type
        console.log('Received message:', data);
        
        if (data.type === 'error' && data.payload) { // Check payload for detailed error
          setError(data.payload.error + (data.payload.details ? `: ${data.payload.details}` : ''));
        } else if (data.type === 'error' && data.error) { // Fallback to top-level error
           setError(data.error);
        }
        // Always add to messages array for App.tsx to handle based on type
        setMessages((prev) => [...prev, data]);

      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Error parsing message from server.');
      }
    };

    return () => {
      if (wsRef.current) { // Check if wsRef.current is not null
         wsRef.current.close();
      }
    };
  }, [url]);

  // Send message function (specifically for chat messages)
  const sendMessage = useCallback((chatId: string, message: string, stream: boolean = true) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected');
      return;
    }

    const chatMessagePayload: ChatMessage = { // Ensure this structure is what backend expects
      type: 'chat_message',
      // sessionId: getSessionId(), // If your chat messages need a sessionId
      payload: {
        chatId,
        message,
        stream
      }
    };

    wsRef.current.send(JSON.stringify(chatMessagePayload));
  }, []);

  return {
    isConnected,
    messages,
    error,
    sendMessage,
    webSocket: wsRef.current // Expose the WebSocket instance
  };
};