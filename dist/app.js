"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const routes_1 = require("@/api/routes");
const errorMiddleware_1 = require("@/api/middleware/errorMiddleware");
const logger_1 = require("@/utils/logger");
const createApp = ({ authController, chatController, healthController, authService, }) => {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Request logging
    app.use((req, res, next) => {
        logger_1.logger.info(`${req.method} ${req.path}`);
        next();
    });
    // Routes
    app.use('/api', (0, routes_1.setupRoutes)(authController, chatController, healthController, authService));
    // Error handling
    app.use(errorMiddleware_1.notFoundHandler);
    app.use(errorMiddleware_1.errorHandler);
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map