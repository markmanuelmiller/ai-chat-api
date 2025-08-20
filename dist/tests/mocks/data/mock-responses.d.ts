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
export declare const mockStreamStatus: (streamName: string) => StreamStatus;
export declare const mockJobStatus: (jobId: string) => JobStatus;
export declare const mockSystemResources: () => SystemResources;
export {};
