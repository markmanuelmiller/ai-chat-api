import { Application } from 'express';
import { handleStreamStatus, handleJobStatus, handleSystemResources } from './handlers';

export function setupRoutes(app: Application) {
  // Stream status endpoint
  app.get('/api/streams/:streamName/status', handleStreamStatus);
  
  // Job status endpoints
  app.get('/api/jobs/:jobId/launcher-status', handleJobStatus);
  app.get('/api/jobs/:jobId/db-status', handleJobStatus);
  app.get('/api/jobs/:jobId/order-status', handleJobStatus);
  
  // System resources endpoint
  app.get('/api/system/resources', handleSystemResources);
} 