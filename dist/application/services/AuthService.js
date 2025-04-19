"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = require("@/domain/entities/User");
const password_1 = require("@/utils/password");
class AuthService {
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    async register(email, password, name) {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const hashedPassword = await (0, password_1.hashPassword)(password);
        const user = User_1.User.create({
            email,
            password: hashedPassword,
            name,
        });
        const savedUser = await this.userRepository.save(user);
        const token = this.jwtService.generateToken(savedUser);
        return {
            user: {
                id: savedUser.id,
                email: savedUser.email,
                name: savedUser.name,
            },
            token,
        };
    }
    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        const token = this.jwtService.generateToken(user);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    }
    async validateToken(token) {
        const payload = this.jwtService.verifyToken(token);
        if (!payload) {
            return null;
        }
        const user = await this.userRepository.findById(payload.userId);
        if (!user) {
            return null;
        }
        return { userId: user.id };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map