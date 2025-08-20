"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockServer = void 0;
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
class MockServer {
    constructor(port = 3001) {
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.app = (0, express_1.default)();
        this.port = port;
        this.setupMiddleware();
        (0, routes_1.setupRoutes)(this.app);
    }
    setupMiddleware() {
        this.app.use(express_1.default.json());
    }
    async findAvailablePort(startPort) {
        let port = startPort;
        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                await new Promise((resolve, reject) => {
                    const testServer = this.app.listen(port, () => {
                        testServer.close(() => resolve(undefined));
                    }).on('error', (err) => {
                        if (err.code === 'EADDRINUSE') {
                            port++;
                            resolve(undefined);
                        }
                        else {
                            reject(err);
                        }
                    });
                });
                return port;
            }
            catch (err) {
                retries++;
                if (retries === this.maxRetries) {
                    throw new Error(`Could not find an available port after ${this.maxRetries} attempts`);
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
        throw new Error('Failed to find available port');
    }
    async start() {
        try {
            this.port = await this.findAvailablePort(this.port);
            return new Promise((resolve, reject) => {
                this.server = this.app.listen(this.port, () => {
                    console.log(`Mock server running on port ${this.port}`);
                    resolve();
                }).on('error', (err) => {
                    reject(new Error(`Failed to start server: ${err.message}`));
                });
            });
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            throw new Error(`Failed to start mock server: ${errorMessage}`);
        }
    }
    async stop() {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.server = null;
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    getBaseUrl() {
        return `http://localhost:${this.port}`;
    }
}
exports.MockServer = MockServer;
// Main function to start the server when this file is executed directly
if (require.main === module) {
    const server = new MockServer();
    server.start().catch(err => {
        console.error('Failed to start mock server:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map