import { ChatRepository } from '@/domain/repositories/ChatRepository';
import { MessageRepository } from '@/domain/repositories/MessageRepository';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { DatabaseService } from '@/infra/database/DatabaseService';
import { PgChatRepository } from './PgChatRepository';
import { PgMessageRepository } from './PgMessageRepository';
import { PgUserRepository } from './PgUserRepository';
import { InMemoryChatRepository } from './InMemoryChatRepository';
import { InMemoryMessageRepository } from './InMemoryMessageRepository';
import { InMemoryUserRepository } from './InMemoryUserRepository';

export class RepositoryFactory {
  static createRepositories(storageType: string, dbService?: DatabaseService) {
    if (storageType === 'memory') {
      return {
        userRepository: new InMemoryUserRepository(),
        chatRepository: new InMemoryChatRepository(),
        messageRepository: new InMemoryMessageRepository(),
      };
    }

    if (!dbService) {
      throw new Error('Database service is required for PostgreSQL storage');
    }

    return {
      userRepository: new PgUserRepository(dbService),
      chatRepository: new PgChatRepository(dbService),
      messageRepository: new PgMessageRepository(dbService),
    };
  }
}
