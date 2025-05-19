import express from 'express';
import { setupRoutes } from './routes';

export class MockServer {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    setupRoutes(this.app);
  }

  private setupMiddleware() {
    this.app.use(express.json());
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Mock server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getBaseUrl(): string {
    return `http://localhost:${this.port}`;
  }
}

// Main function to start the server when this file is executed directly
if (require.main === module) {
  const server = new MockServer();
  server.start().catch(err => {
    console.error('Failed to start mock server:', err);
    process.exit(1);
  });
}