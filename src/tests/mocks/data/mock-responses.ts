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

export const mockStreamStatus = (streamName: string): StreamStatus => {
  const level = getRandomLevel();
  return {
    streamName,
    status: level === "error" ? "error" : "running",
    error: level === "error" ? "Error message: " + streamName + " is not running" : undefined,
  };
};

export const mockJobStatus = (jobId: string): JobStatus => {
  const level = getRandomLevel();
  return {
    jobId,
    status: level === "error" ? "failed" : "success",
    details: level === "error" ? "Error message: " + jobId + " is not running" : `Mock ${jobId} status for job ${jobId}`
  };
};

export const mockSystemResources = (): SystemResources => {
  // generate random numbers between 10 and 100
  const cpu = Math.floor(Math.random() * 90) + 10;
  const memory = Math.floor(Math.random() * 90) + 10;
  const disk = Math.floor(Math.random() * 90) + 10;
  const networkIn = Math.floor(Math.random() * 90) + 10;
  const networkOut = Math.floor(Math.random() * 90) + 10;
  return {
    cpu,
    memory,
    disk,
    network: {
      in: networkIn,
      out: networkOut
    }
  };
}; 