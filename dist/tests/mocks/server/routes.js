"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const handlers_1 = require("./handlers");
function setupRoutes(app) {
    // Stream status endpoint
    app.get('/api/streams/:streamName/status', handlers_1.handleStreamStatus);
    // Job status endpoints
    app.get('/api/jobs/:jobId/launcher-status', handlers_1.handleJobStatus);
    app.get('/api/jobs/:jobId/db-status', handlers_1.handleJobStatus);
    app.get('/api/jobs/:jobId/order-status', handlers_1.handleJobStatus);
    // System resources endpoint
    app.get('/api/system/resources', handlers_1.handleSystemResources);
}
//# sourceMappingURL=routes.js.map