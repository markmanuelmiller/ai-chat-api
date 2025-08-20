"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryFactory = void 0;
const PgChatRepository_1 = require("./PgChatRepository");
const PgMessageRepository_1 = require("./PgMessageRepository");
const PgUserRepository_1 = require("./PgUserRepository");
const InMemoryChatRepository_1 = require("./InMemoryChatRepository");
const InMemoryMessageRepository_1 = require("./InMemoryMessageRepository");
const InMemoryUserRepository_1 = require("./InMemoryUserRepository");
class RepositoryFactory {
    static createRepositories(storageType, dbService) {
        if (storageType === 'memory') {
            return {
                userRepository: new InMemoryUserRepository_1.InMemoryUserRepository(),
                chatRepository: new InMemoryChatRepository_1.InMemoryChatRepository(),
                messageRepository: new InMemoryMessageRepository_1.InMemoryMessageRepository(),
            };
        }
        if (!dbService) {
            throw new Error('Database service is required for PostgreSQL storage');
        }
        return {
            userRepository: new PgUserRepository_1.PgUserRepository(dbService),
            chatRepository: new PgChatRepository_1.PgChatRepository(dbService),
            messageRepository: new PgMessageRepository_1.PgMessageRepository(dbService),
        };
    }
}
exports.RepositoryFactory = RepositoryFactory;
//# sourceMappingURL=RepositoryFactory.js.map