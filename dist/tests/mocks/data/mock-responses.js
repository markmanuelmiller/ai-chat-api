"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockSystemResources = exports.mockJobStatus = exports.mockStreamStatus = void 0;
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
};
const mockStreamStatus = (streamName) => {
    const level = getRandomLevel();
    return {
        streamName,
        status: level === "error" ? "error" : "running",
        error: level === "error" ? "Error message: " + streamName + " is not running" : undefined,
    };
};
exports.mockStreamStatus = mockStreamStatus;
const mockJobStatus = (jobId) => {
    const level = getRandomLevel();
    return {
        jobId,
        status: level === "error" ? "failed" : "success",
        details: level === "error" ? "Error message: " + jobId + " is not running" : `Mock ${jobId} status for job ${jobId}`
    };
};
exports.mockJobStatus = mockJobStatus;
const mockSystemResources = () => {
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
exports.mockSystemResources = mockSystemResources;
//# sourceMappingURL=mock-responses.js.map