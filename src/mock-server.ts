import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

interface StreamStatus {
  streamName: string;
  status: 'running' | 'stopped' | 'error';
  error?: string;
  errorDescription?: string;
}

interface JobStatus {
  jobId: string;
  status: 'success' | 'failed' | 'pending';
  details?: string;
}

interface SystemResources {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
}

const levels = {
  "error": .3,
  "warn": .3,
  "info": .4,
};

const getRandomLevel = () => {
  const random = Math.random();
  let cumulativeProb = 0;
  for (const [level, probability] of Object.entries(levels)) {
    cumulativeProb += probability;
    if (random <= cumulativeProb) {
      return level;
    }
  }
  return "info";
}

// Stream status endpoint
app.get('/api/streams/:streamName/status', (req, res) => {
  const { streamName } = req.params;
  const level = getRandomLevel();
  const status: StreamStatus = {
    streamName,
    status: level === "error" ? "error" : "running",
    error: level === "error" ? "Error message: " + streamName + " is not running" : undefined,
  };
  res.json(status);
});

// Job status endpoints
app.get('/api/jobs/:jobId/launcher-status', (req, res) => {
  const { jobId } = req.params;
  const level = getRandomLevel();
  const status: JobStatus = {
    jobId,
    status: level === "error" ? "failed" : "success",
    details: level === "error" ? "Error message: " + jobId + " is not running" : `Mock ${jobId} status for job ${jobId}`
  };
  res.json(status);
});

app.get('/api/jobs/:jobId/db-status', (req, res) => {
  const { jobId } = req.params;
  const level = getRandomLevel();
  const status: JobStatus = {
    jobId,
    status: level === "error" ? "failed" : "success",
    details: level === "error" ? "Error message: " + jobId + " is not running" : `Mock ${jobId} status for job ${jobId}`
  };
  res.json(status);
});

app.get('/api/jobs/:jobId/order-status', (req, res) => {
  const { jobId } = req.params;
  const level = getRandomLevel();
  const status: JobStatus = {
    jobId,
    status: level === "error" ? "failed" : "success",
    details: level === "error" ? "Error message: " + jobId + " is not running" : `Mock ${jobId} status for job ${jobId}`
  };
  res.json(status);
});

// System resources endpoint
app.get('/api/system/resources', (req, res) => {
  // generate random numbers between 60 and 100
  const cpu = Math.floor(Math.random() * 40) + 60;
  const memory = Math.floor(Math.random() * 40) + 60;
  const disk = Math.floor(Math.random() * 40) + 60;
  const networkIn = Math.floor(Math.random() * 40) + 60;
  const networkOut = Math.floor(Math.random() * 40) + 60;
  
  const resources: SystemResources = {
    cpu,
    memory,
    disk,
    network: {
      in: networkIn,
      out: networkOut
    }
  };
  res.json(resources);
});

app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
}); 