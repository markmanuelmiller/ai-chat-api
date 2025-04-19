import { User } from '@/domain/entities/User';
export interface TokenPayload {
    userId: string;
    email: string;
}
export declare class JwtService {
    generateToken(user: User): string;
    verifyToken(token: string): TokenPayload | null;
}
