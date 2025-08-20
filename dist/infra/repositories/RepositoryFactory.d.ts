import { DatabaseService } from '@/infra/database/DatabaseService';
import { PgChatRepository } from './PgChatRepository';
import { PgMessageRepository } from './PgMessageRepository';
import { PgUserRepository } from './PgUserRepository';
import { InMemoryChatRepository } from './InMemoryChatRepository';
import { InMemoryMessageRepository } from './InMemoryMessageRepository';
import { InMemoryUserRepository } from './InMemoryUserRepository';
export declare class RepositoryFactory {
    static createRepositories(storageType: string, dbService?: DatabaseService): {
        userRepository: InMemoryUserRepository;
        chatRepository: InMemoryChatRepository;
        messageRepository: InMemoryMessageRepository;
    } | {
        userRepository: PgUserRepository;
        chatRepository: PgChatRepository;
        messageRepository: PgMessageRepository;
    };
}
