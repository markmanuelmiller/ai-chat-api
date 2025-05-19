import express from 'express';
import { setupRoutes } from './routes';

export class MockServer {
  private app: express.Application;
  private server: any;
  private port: number;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    setupRoutes(this.app);
  }

  private setupMiddleware() {
    this.app.use(express.json());
  }

  private async findAvailablePort(startPort: number): Promise<number> {
    let port = startPort;
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        await new Promise((resolve, reject) => {
          const testServer = this.app.listen(port, () => {
            testServer.close(() => resolve(undefined));
          }).on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
              port++;
              resolve(undefined);
            } else {
              reject(err);
            }
          });
        });
        return port;
      } catch (err) {
        retries++;
        if (retries === this.maxRetries) {
          throw new Error(`Could not find an available port after ${this.maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    throw new Error('Failed to find available port');
  }

  async start(): Promise<void> {
    try {
      this.port = await this.findAvailablePort(this.port);
      return new Promise((resolve, reject) => {
        this.server = this.app.listen(this.port, () => {
          console.log(`Mock server running on port ${this.port}`);
          resolve();
        }).on('error', (err: any) => {
          reject(new Error(`Failed to start server: ${err.message}`));
        });
      });
    } catch (err) {
      throw new Error(`Failed to start mock server: ${err.message}`);
    }
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err: any) => {
          if (err) {
            reject(err);
            return;
          }
          this.server = null;
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