import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { JwtService } from '@/infra/auth/JwtService';
export interface AuthResult {
    user: {
        id: string;
        email: string;
        name: string;
    };
    token: string;
}
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    constructor(userRepository: UserRepository, jwtService: JwtService);
    register(email: string, password: string, name: string): Promise<AuthResult>;
    login(email: string, password: string): Promise<AuthResult>;
    validateToken(token: string): Promise<{
        userId: string;
    } | null>;
    createUserIfNotExists(userId: string, email: string, name: string): Promise<User>;
}
