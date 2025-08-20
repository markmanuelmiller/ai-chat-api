"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSystemResources = exports.handleJobStatus = exports.handleStreamStatus = void 0;
const mock_responses_1 = require("../data/mock-responses");
const handleStreamStatus = (req, res) => {
    const { streamName } = req.params;
    const response = (0, mock_responses_1.mockStreamStatus)(streamName);
    // formatted log for response
    console.log(`STREAMSTATUS: [${response.status}] ${response.error ? response.error : "No error"}`);
    res.json(response);
};
exports.handleStreamStatus = handleStreamStatus;
const handleJobStatus = (req, res) => {
    const { jobId } = req.params;
    // const endpoint = req.path.split('/').pop();
    const response = (0, mock_responses_1.mockJobStatus)(jobId);
    // formatted log for response
    console.log(`JOBSTATUS: [${response.status}] ${response.details}`);
    res.json(response);
};
exports.handleJobStatus = handleJobStatus;
const handleSystemResources = (_req, res) => {
    const response = (0, mock_responses_1.mockSystemResources)();
    // formatted log for response
    console.log(`SYSTEMRESOURCES: [CPU: ${response.cpu}%, MEM: ${response.memory}%, DISK: ${response.disk}%, NETWORK: ${response.network.in}%, ${response.network.out}%]`);
    res.json(response);
};
exports.handleSystemResources = handleSystemResources;
//# sourceMappingURL=handlers.js.map