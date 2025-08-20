export declare class MockServer {
    private app;
    private server;
    private port;
    private maxRetries;
    private retryDelay;
    constructor(port?: number);
    private setupMiddleware;
    private findAvailablePort;
    start(): Promise<void>;
    stop(): Promise<void>;
    getBaseUrl(): string;
}
