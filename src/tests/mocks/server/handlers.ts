import { Request, Response } from 'express';
import { mockStreamStatus, mockJobStatus, mockSystemResources } from '../data/mock-responses';

export const handleStreamStatus = (req: Request, res: Response) => {
  const { streamName } = req.params;
  const response = mockStreamStatus(streamName);
  // formatted log for response
  console.log(`STREAMSTATUS: [${response.status}] ${response.error ? response.error : "No error"}`);
  res.json(response);
};

export const handleJobStatus = (req: Request, res: Response) => {
  const { jobId } = req.params;
  // const endpoint = req.path.split('/').pop();
  const response = mockJobStatus(jobId);
  // formatted log for response
  console.log(`JOBSTATUS: [${response.status}] ${response.details}`);
  res.json(response);
};

export const handleSystemResources = (_req: Request, res: Response) => {
  const response = mockSystemResources();
  // formatted log for response
  console.log(`SYSTEMRESOURCES: [CPU: ${response.cpu}%, MEM: ${response.memory}%, DISK: ${response.disk}%, NETWORK: ${response.network.in}%, ${response.network.out}%]`);
  res.json(response);
}; 