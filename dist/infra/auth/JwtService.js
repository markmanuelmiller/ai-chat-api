"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const logger_1 = require("@/utils/logger");
class JwtService {
    // Simple stub implementation
    generateToken(user) {
        // Just return a token-like string
        return `mock_token_${user.id}`;
    }
    verifyToken(token) {
        try {
            // Simple mock implementation
            // Extract user id from the token format we're using in generateToken
            const userId = token.replace('mock_token_', '');
            return { userId, email: '' };
        }
        catch (error) {
            logger_1.logger.error('Error verifying JWT token', error);
            return null;
        }
    }
}
exports.JwtService = JwtService;
//# sourceMappingURL=JwtService.js.map