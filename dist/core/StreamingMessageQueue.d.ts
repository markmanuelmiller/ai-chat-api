export interface StreamableMessage {
    type: string;
    payload: any;
    timestamp: string;
    sessionId?: string;
}
export declare class StreamingMessageQueue {
    private queue;
    private closed;
    private waitingResolver;
    /**
     * Adds a message to the queue.
     * If there's a pending getMessage() call waiting for a message,
     * it resolves that call immediately with the new message.
     * @param message The message to add.
     */
    addMessage(message: StreamableMessage): void;
    /**
     * Retrieves a message from the queue.
     * If the queue is empty, it waits until a message is added or the queue is closed.
     * @returns A promise that resolves with the next message, or null if the queue is closed and empty.
     */
    getMessage(): Promise<StreamableMessage | null>;
    /**
     * Closes the queue. No more messages can be added.
     * Any pending getMessage() call will be resolved with null.
     */
    close(): void;
    /**
     * Checks if the queue is currently empty.
     * @returns True if the queue has no messages, false otherwise.
     */
    isEmpty(): boolean;
    /**
     * Checks if the queue has been closed.
     * @returns True if the queue is closed, false otherwise.
     */
    isClosed(): boolean;
    /**
     * Gets the current number of messages in the queue.
     * @returns The number of messages.
     */
    size(): number;
}
