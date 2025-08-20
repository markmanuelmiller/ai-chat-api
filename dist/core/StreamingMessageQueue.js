"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingMessageQueue = void 0;
class StreamingMessageQueue {
    constructor() {
        this.queue = [];
        this.closed = false;
        // A promise resolver for a pending getMessage call.
        // When a message is added, this resolver is called to fulfill the promise.
        this.waitingResolver = null;
    }
    /**
     * Adds a message to the queue.
     * If there's a pending getMessage() call waiting for a message,
     * it resolves that call immediately with the new message.
     * @param message The message to add.
     */
    addMessage(message) {
        if (this.closed) {
            console.warn(`Attempted to add message to a closed queue (sessionId: ${message.sessionId || 'N/A'}, type: ${message.type})`);
            return;
        }
        if (this.waitingResolver) {
            // If getMessage is waiting, resolve it directly without pushing to queue first
            const resolver = this.waitingResolver;
            this.waitingResolver = null;
            resolver(message);
        }
        else {
            this.queue.push(message);
        }
    }
    /**
     * Retrieves a message from the queue.
     * If the queue is empty, it waits until a message is added or the queue is closed.
     * @returns A promise that resolves with the next message, or null if the queue is closed and empty.
     */
    async getMessage() {
        if (this.queue.length > 0) {
            return this.queue.shift();
        }
        if (this.closed) {
            return null; // No more messages and queue is closed
        }
        // Wait for a new message to be added or for the queue to be closed
        return new Promise((resolve) => {
            this.waitingResolver = resolve;
        });
    }
    /**
     * Closes the queue. No more messages can be added.
     * Any pending getMessage() call will be resolved with null.
     */
    close() {
        if (this.closed) {
            return;
        }
        this.closed = true;
        if (this.waitingResolver) {
            const resolver = this.waitingResolver;
            this.waitingResolver = null;
            resolver(null); // Signal to waiting getter that queue is closed
        }
        // Consider if a special 'STREAM_END' message should be enqueued here automatically.
        // For now, a null from getMessage() signals the end.
    }
    /**
     * Checks if the queue is currently empty.
     * @returns True if the queue has no messages, false otherwise.
     */
    isEmpty() {
        return this.queue.length === 0;
    }
    /**
     * Checks if the queue has been closed.
     * @returns True if the queue is closed, false otherwise.
     */
    isClosed() {
        return this.closed;
    }
    /**
     * Gets the current number of messages in the queue.
     * @returns The number of messages.
     */
    size() {
        return this.queue.length;
    }
}
exports.StreamingMessageQueue = StreamingMessageQueue;
//# sourceMappingURL=StreamingMessageQueue.js.map