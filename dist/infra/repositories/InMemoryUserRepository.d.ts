import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
export declare class InMemoryUserRepository implements UserRepository {
    private users;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    save(user: User): Promise<User>;
    delete(id: string): Promise<void>;
}
