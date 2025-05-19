import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Mock data
const mockStreamStatuses: Record<string, { status: string; error?: string; errorDescription?: string }> = {
  'test-stream': {
    status: 'running',
  },
  'error-stream': {
    status: 'error',
    error: 'STREAM_ERROR',
    errorDescription: 'Stream failed to start',
  },
};

const mockJobStatuses: Record<string, { status: string }> = {
  '123': {
    status: 'active',
  },
};

// Stream status endpoint
app.get('/api/streams/:streamName/status', (req, res) => {
  const { streamName } = req.params;
  const status = mockStreamStatuses[streamName] || {
    status: 'unknown',
    error: 'NOT_FOUND',
    errorDescription: 'Stream not found',
  };
  res.json(status);
});

// Job status endpoints
app.get('/api/jobs/:jobId/launcher-status', (req, res) => {
  const { jobId } = req.params;
  const status = mockJobStatuses[jobId] || { status: 'unknown' };
  res.json(status);
});

app.get('/api/jobs/:jobId/db-status', (req, res) => {
  const { jobId } = req.params;
  const status = mockJobStatuses[jobId] || { status: 'unknown' };
  res.json(status);
});

app.get('/api/jobs/:jobId/order-status', (req, res) => {
  const { jobId } = req.params;
  const status = mockJobStatuses[jobId] || { status: 'unknown' };
  res.json(status);
});

// System resources endpoint
app.get('/api/system/resources', (req, res) => {
  res.json({
    cpu: 45,
    memory: 60,
    disk: 75,
    network: {
      in: 30,
      out: 25,
    },
  });
});

app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
}); 