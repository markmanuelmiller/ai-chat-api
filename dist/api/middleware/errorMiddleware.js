"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("@/utils/logger");
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error(`Error processing request: ${req.method} ${req.path}`, err);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }
    return res.status(500).json({
        error: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    logger_1.logger.warn(`Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'Route not found',
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorMiddleware.js.map