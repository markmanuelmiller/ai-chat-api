import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import ConnectionStatus from './components/ConnectionStatus';
import { useWebSocket, WebSocketMessage as GenericWebSocketMessage, DebugParams } from './hooks/useWebSocket';

// Default chat ID
const DEFAULT_CHAT_ID = '123e4567-e89b-12d3-a456-426614174001';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
}

// Local DebugParams definition is REMOVED as it's imported from useWebSocket.ts

export interface HitlData {
  debugParams: DebugParams; // This will now correctly refer to the imported DebugParams
  resumeState: any; 
  sessionId: string;
}

export interface ResumeDebugStreamClientPayload {
  sessionId: string;
  resumeState: any;
  userConfirmation: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [hitlData, setHitlData] = useState<HitlData | null>(null); 

  const webSocketUrl = `ws://localhost:3000?token=abc123&chatId=${encodeURIComponent(DEFAULT_CHAT_ID)}`;
  const { isConnected, messages: wsMessages, error, sendMessage: sendChatMessageViaHook, webSocket } = useWebSocket(webSocketUrl);

  useEffect(() => {
    if (wsMessages.length === 0) return;
    const lastMessage = wsMessages[wsMessages.length - 1] as GenericWebSocketMessage;

    if (!lastMessage || typeof lastMessage.type !== 'string') {
      console.warn('Received WebSocket message without a valid type property:', lastMessage);
      return;
    }
    console.log('Client received WS message:', lastMessage.type, lastMessage);

    switch (lastMessage.type) {
      case 'message_received':
        // No specific payload to check beyond type, handled by GenericWebSocketMessage
        setWaitingForResponse(true);
        break;

      case 'STREAM_START':
        if (lastMessage.type === 'STREAM_START') { // Type guard
            console.log('Stream started:', lastMessage.payload);
            setCurrentResponse(''); 
            setWaitingForResponse(true);
            setHitlData(null); 
        }
        break;

      case 'GRAPH_MESSAGE':
        if (lastMessage.type === 'GRAPH_MESSAGE' && lastMessage.payload && typeof lastMessage.payload.message === 'string') {
          const graphMsgContent = `[${lastMessage.payload.node || 'Graph'}]: ${lastMessage.payload.message}`;
          setMessages(prev => [
            ...prev,
            { id: uuidv4(), content: graphMsgContent, isUser: false },
          ]);
        }
        break;

      case 'LLM_CHUNK':
        if (lastMessage.type === 'LLM_CHUNK' && lastMessage.payload && typeof lastMessage.payload.chunk === 'string') {
          setCurrentResponse(prev => prev + lastMessage.payload.chunk);
        }
        break;

      case 'NODE_OUTPUT':
        if (lastMessage.type === 'NODE_OUTPUT') { // Type guard
            console.log('Node Output Received:', lastMessage.payload);
        }
        break;

      case 'NODE_SKIPPED_OR_EMPTY':
         if (lastMessage.type === 'NODE_SKIPPED_OR_EMPTY') { // Type guard
            console.log('Node Skipped or Empty:', lastMessage.payload);
        }
        break;
      
      case 'HITL_REQUIRED':
        if (lastMessage.type === 'HITL_REQUIRED' && lastMessage.payload && lastMessage.payload.debugParams && lastMessage.payload.resumeState && lastMessage.sessionId) {
          setHitlData({
            debugParams: lastMessage.payload.debugParams,
            resumeState: lastMessage.payload.resumeState,
            sessionId: lastMessage.sessionId,
          });
          setWaitingForResponse(false); 
        } else if (lastMessage.type === 'HITL_REQUIRED') { // Log if payload is invalid for this type
          console.error('Invalid HITL_REQUIRED payload:', lastMessage.payload);
        }
        break;

      case 'resume_ack':
        if (lastMessage.type === 'resume_ack') { // Type guard
            console.log('Resume Acknowledged by server:', lastMessage.payload);
            setWaitingForResponse(true); 
        }
        break;

      case 'error':
        let errorMsgContent = '**ERROR:** An unexpected error occurred.';
        if (lastMessage.type === 'error') { // This type guard is now consistent
            console.error('Raw error message from backend stream:', lastMessage);
            // Safely access properties based on ErrorMessage interface
            if (lastMessage.payload && typeof lastMessage.payload.error === 'string') {
                errorMsgContent = `**ERROR:** ${lastMessage.payload.error}${lastMessage.payload.details ? ` - ${lastMessage.payload.details}` : ''}`;
            } else if (lastMessage.error && typeof lastMessage.error === 'string') { 
                errorMsgContent = `**ERROR:** ${lastMessage.error}`;
            }
        }
        setMessages(prev => [
          ...prev,
          { id: uuidv4(), content: errorMsgContent, isUser: false },
        ]);
        setCurrentResponse(''); 
        setWaitingForResponse(false);
        setHitlData(null); 
        break;

      case 'STREAM_END':
        let streamEndFinalResponse = '';
        if (lastMessage.type === 'STREAM_END') {
            // Check for finalResponse
            if (lastMessage.payload && typeof lastMessage.payload.finalResponse === 'string' && lastMessage.payload.finalResponse.trim()) {
                streamEndFinalResponse = lastMessage.payload.finalResponse;
            } else if (currentResponse.trim()) {
                streamEndFinalResponse = currentResponse.trim();
            }

            if (streamEndFinalResponse) {
              setMessages(prev => [
                ...prev,
                { id: uuidv4(), content: streamEndFinalResponse, isUser: false },
              ]);
            } else {
              // If no finalResponse, check for a system message within the payload
              // Explicitly ensure lastMessage.payload exists and has a message property
              if (lastMessage.payload && typeof lastMessage.payload.message === 'string' && lastMessage.payload.message !== "human_input_required") {
                 const systemMessage = lastMessage.payload.message; // Assign to a new constant
                 setMessages(prev => [
                    ...prev,
                    { id: uuidv4(), content: `[System: ${systemMessage}]`, isUser: false }, // Use the new constant
                ]);
              }
            }
        }
        setCurrentResponse('');
        setWaitingForResponse(false);
        setHitlData(null); 
        break;

      case 'chat_response_full':
        if (lastMessage.type === 'chat_response_full' && lastMessage.payload && typeof lastMessage.payload.content === 'string') { 
            setMessages(prev => [
            ...prev,
            { id: uuidv4(), content: lastMessage.payload.content, isUser: false },
            ]);
        }
        setWaitingForResponse(false);
        break;
      
      default:
        // This default case handles types not explicitly listed above.
        // TypeScript should warn if any type in GenericWebSocketMessage is not handled.
        const unhandled = lastMessage as any; // Use 'as any' carefully for logging unknown structures
        if (unhandled && unhandled.type) {
            console.warn('Received unhandled WebSocket message type:', unhandled.type, unhandled);
        } else {
            console.warn('Received unhandled WebSocket message with no type or unknown structure:', unhandled);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsMessages, currentResponse]);

  const handleSendMessage = useCallback((content: string) => {
    if (!isConnected || hitlData) return;
    setMessages(prev => [
      ...prev,
      { id: uuidv4(), content, isUser: true }
    ]);
    sendChatMessageViaHook(DEFAULT_CHAT_ID, content, true);
  }, [isConnected, hitlData, sendChatMessageViaHook]);

  const handleHitlResponse = useCallback((approved: boolean) => {
    if (!hitlData) return;

    const resumePayload: ResumeDebugStreamClientPayload = {
      sessionId: hitlData.sessionId,
      resumeState: hitlData.resumeState,
      userConfirmation: approved,
    };
    
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ type: 'RESUME_DEBUG_STREAM', payload: resumePayload }));
    } else {
      console.error('Cannot send RESUME_DEBUG_STREAM: WebSocket not available or not open.');
      setMessages(prev => [...prev, { 
        id: uuidv4(), 
        content: 'Error: Could not send resume command. Connection issue.', 
        isUser: false 
      }]);
    }

    setHitlData(null); 
  }, [hitlData, webSocket]);

  const displayMessages = [...messages];
  if (currentResponse && !hitlData) { 
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
        <h1 className="text-xl font-bold">AI Chat (HITL Enabled)</h1>
      </header>
      
      <ConnectionStatus isConnected={isConnected} error={error} />
      
      <ChatWindow 
        messages={displayMessages}
        isConnected={isConnected} 
      />
      
      {hitlData && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-3">Human Input Required</h3>
            <p className="mb-1 text-sm text-gray-600">The process requires your confirmation for the following data:</p>
            <div className="bg-gray-100 p-3 rounded mb-3 text-xs max-h-48 overflow-y-auto">
              <pre>{JSON.stringify(hitlData.debugParams, null, 2)}</pre>
            </div>
            <p className="mb-4 text-sm text-gray-700">Do you want to approve and continue?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleHitlResponse(false)}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                disabled={!isConnected} 
              >
                Reject
              </button>
              <button
                onClick={() => handleHitlResponse(true)}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
                disabled={!isConnected} 
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={!isConnected || waitingForResponse || !!hitlData} 
      />
    </div>
  );
}

export default App;