"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const errorMiddleware_1 = require("@/api/middleware/errorMiddleware");
class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.register = async (req, res) => {
            try {
                const { email, password, name } = req.body;
                if (!email || !password || !name) {
                    throw new errorMiddleware_1.AppError(400, 'Email, password and name are required');
                }
                const result = await this.authService.register(email, password, name);
                res.status(201).json(result);
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('already exists')) {
                    throw new errorMiddleware_1.AppError(409, error.message);
                }
                throw error;
            }
        };
        this.login = async (req, res) => {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    throw new errorMiddleware_1.AppError(400, 'Email and password are required');
                }
                const result = await this.authService.login(email, password);
                res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('Invalid email or password')) {
                    throw new errorMiddleware_1.AppError(401, 'Invalid email or password');
                }
                throw error;
            }
        };
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map