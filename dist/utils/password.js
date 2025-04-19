"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const crypto_1 = __importDefault(require("crypto"));
// Simple password hashing for demo purposes
// In a real app, use bcrypt or argon2
async function hashPassword(password) {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
        crypto_1.default.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}
async function comparePassword(password, hash) {
    const [salt, key] = hash.split(':');
    return new Promise((resolve, reject) => {
        crypto_1.default.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(key === derivedKey.toString('hex'));
        });
    });
}
//# sourceMappingURL=password.js.map