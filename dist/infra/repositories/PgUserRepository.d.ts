import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { DatabaseService } from '@/infra/database/DatabaseService';
export declare class PgUserRepository implements UserRepository {
    private db;
    constructor(db: DatabaseService);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    save(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    private mapToEntity;
}
