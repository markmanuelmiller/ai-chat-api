"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("@/domain/entities/User");
describe('User Entity', () => {
    it('should create a user with default values', () => {
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
        };
        const user = User_1.User.create(userData);
        expect(user.email).toBe(userData.email);
        expect(user.password).toBe(userData.password);
        expect(user.name).toBe(userData.name);
        expect(user.id).toBeDefined();
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
    });
    it('should create a user with provided values', () => {
        const now = new Date();
        const userId = 'test-id-123';
        const userData = {
            id: userId,
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            createdAt: now,
            updatedAt: now,
        };
        const user = User_1.User.create(userData);
        expect(user.id).toBe(userId);
        expect(user.email).toBe(userData.email);
        expect(user.password).toBe(userData.password);
        expect(user.name).toBe(userData.name);
        expect(user.createdAt).toBe(now);
        expect(user.updatedAt).toBe(now);
    });
    it('should compare two users correctly', () => {
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
        };
        const user1 = User_1.User.create(userData);
        const user2 = User_1.User.create({ ...userData, id: user1.id });
        const user3 = User_1.User.create({ ...userData });
        expect(user1.equals(user2)).toBe(true);
        expect(user1.equals(user3)).toBe(false);
    });
});
//# sourceMappingURL=User.test.js.map