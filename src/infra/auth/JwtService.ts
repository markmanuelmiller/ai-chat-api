import jwt from 'jsonwebtoken';
import { User } from '@/domain/entities/User';
import { logger } from '@/utils/logger';

export interface TokenPayload {
  userId: string;
  email: string;
}

export class JwtService {
  // Simple stub implementation
  generateToken(user: User): string {
    // Just return a token-like string
    return `mock_token_${user.id}`;
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      // Simple mock implementation
      // Extract user id from the token format we're using in generateToken
      const userId = token.replace('mock_token_', '');
      return { userId, email: '' };
    } catch (error) {
      logger.error('Error verifying JWT token', error);
      return null;
    }
  }
}
