"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const logger_1 = require("@/utils/logger");
const authMiddleware = (authService) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authorization token required' });
            }
            const token = authHeader.split(' ')[1];
            const payload = await authService.validateToken(token);
            if (!payload) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            req.userId = payload.userId;
            next();
        }
        catch (error) {
            logger_1.logger.error('Authentication error', error);
            return res.status(401).json({ error: 'Authentication failed' });
        }
    };
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map