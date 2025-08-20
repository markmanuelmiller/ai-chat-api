"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const LOG_LEVELS = {
    info: 0.7, // 70% probability
    warning: 0.2, // 20% probability
    error: 0.1 // 10% probability
};
const SERVICES = {
    database: [
        { info: 'Connection pool initialized', warning: 'Connection pool near capacity', error: 'Lost connection to database' },
        { info: 'Query executed successfully', warning: 'Query taking longer than expected', error: 'Query timeout exceeded' },
        { info: 'Database backup completed', warning: 'Backup size larger than usual', error: 'Backup failed' }
    ],
    api: [
        { info: 'Request processed successfully', warning: 'Rate limit approaching threshold', error: 'Rate limit exceeded' },
        { info: 'Cache hit', warning: 'Cache miss', error: 'Cache service unavailable' },
        { info: 'API endpoint called', warning: 'Response time above threshold', error: 'Internal server error' }
    ],
    auth: [
        { info: 'User authenticated successfully', warning: 'Multiple failed login attempts', error: 'Authentication service down' },
        { info: 'Token validated', warning: 'Token expiring soon', error: 'Invalid token' },
        { info: 'Password reset requested', warning: 'Suspicious login attempt', error: 'Account locked' }
    ],
    queue: [
        { info: 'Message queued successfully', warning: 'Queue size above threshold', error: 'Queue overflow' },
        { info: 'Worker started', warning: 'Worker memory usage high', error: 'Worker crashed' },
        { info: 'Task completed', warning: 'Task retry count high', error: 'Task failed permanently' }
    ]
};
function generateLogs() {
    const numLogs = Math.floor(Math.random() * 21) + 20; // Random number between 20-40
    const logs = [];
    const now = new Date();
    for (let i = 0; i < numLogs; i++) {
        const service = Object.keys(SERVICES)[Math.floor(Math.random() * Object.keys(SERVICES).length)];
        const serviceMessages = SERVICES[service];
        const messageTemplate = serviceMessages[Math.floor(Math.random() * serviceMessages.length)];
        // Determine log level based on probabilities
        const rand = Math.random();
        let level;
        if (rand < LOG_LEVELS.info) {
            level = 'info';
        }
        else if (rand < LOG_LEVELS.info + LOG_LEVELS.warning) {
            level = 'warning';
        }
        else {
            level = 'error';
        }
        const timestamp = new Date(now.getTime() - (numLogs - i) * 1000).toISOString();
        logs.push({
            timestamp,
            level,
            service,
            message: messageTemplate[level]
        });
    }
    return logs;
}
const app = (0, express_1.default)();
const port = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
// Stream status endpoint
app.get('/api/streams/:streamName/status', (req, res) => {
    const { streamName } = req.params;
    const level = getRandomLevel();
    const status = {
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
    const status = {
        jobId,
        status: level === "error" ? "failed" : "success",
        details: level === "error" ? "Error message: " + jobId + " is not running" : `Mock ${jobId} status for job ${jobId}`
    };
    res.json(status);
});
app.get('/api/jobs/:jobId/db-status', (req, res) => {
    const { jobId } = req.params;
    const level = getRandomLevel();
    const status = {
        jobId,
        status: level === "error" ? "failed" : "success",
        details: level === "error" ? "Error message: " + jobId + " is not running" : `Mock ${jobId} status for job ${jobId}`
    };
    res.json(status);
});
app.get('/api/jobs/:jobId/order-status', (req, res) => {
    const { jobId } = req.params;
    const level = getRandomLevel();
    const status = {
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
    const resources = {
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
app.get('/api/streams/:streamName/logs', (req, res) => {
    const logs = generateLogs();
    res.json({
        logs: logs.map(log => `${log.timestamp} [${log.level.toUpperCase()}] ${log.service}: ${log.message}`),
        errors: logs.filter(log => log.level === 'error').map(log => `${log.timestamp} [ERROR] ${log.service}: ${log.message}`),
        warnings: logs.filter(log => log.level === 'warning').map(log => `${log.timestamp} [WARNING] ${log.service}: ${log.message}`)
    });
});
app.listen(port, () => {
    console.log(`Mock server running at http://localhost:${port}`);
});
//# sourceMappingURL=mock-server.js.map