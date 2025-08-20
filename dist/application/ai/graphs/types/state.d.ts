export interface Intent {
    type: 'request_filters' | 'extract_stream_name' | 'other';
}
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}
export interface GraphState {
    messages: Array<{
        role: string;
        content: string;
    }>;
    intent?: Intent;
    streamName?: string;
    filterCriteria?: object;
    toolArgs?: object;
    toolResult?: ToolResult;
    logs?: string[];
    nextStep?: string;
    chatId: string;
}
