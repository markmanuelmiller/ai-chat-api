import { AuthService } from '@/application/services/AuthService';
import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { JwtService } from '@/infra/auth/JwtService';

// Mock implementations
jest.mock('@/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  comparePassword: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    jwtService = {
      generateToken: jest.fn().mockReturnValue('test_token'),
      verifyToken: jest.fn(),
    } as JwtService;

    authService = new AuthService(userRepository, jwtService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const savedUser = User.create({
        ...userData,
        password: 'hashed_password',
        id: 'test-id',
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.save as jest.Mock).mockResolvedValue(savedUser);

      const result = await authService.register(
        userData.email,
        userData.password,
        userData.name,
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(userRepository.save).toHaveBeenCalled();
      expect(jwtService.generateToken).toHaveBeenCalledWith(savedUser);

      expect(result).toEqual({
        user: {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
        },
        token: 'test_token',
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const existingUser = User.create(userData);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);

      await expect(
        authService.register(userData.email, userData.password, userData.name),
      ).rejects.toThrow('User with this email already exists');

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
      };

      const user = User.create({
        ...userData,
        id: 'test-id',
      });

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(user);

      const result = await authService.login(userData.email, 'password123');

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(jwtService.generateToken).toHaveBeenCalledWith(user);

      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token: 'test_token',
      });
    });

    it('should throw error if user not found', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'Invalid email or password',
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('validateToken', () => {
    it('should validate a token successfully', async () => {
      const user = User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        id: 'test-id',
      });

      (jwtService.verifyToken as jest.Mock).mockReturnValue({ userId: user.id });
      (userRepository.findById as jest.Mock).mockResolvedValue(user);

      const result = await authService.validateToken('valid_token');

      expect(jwtService.verifyToken).toHaveBeenCalledWith('valid_token');
      expect(userRepository.findById).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ userId: user.id });
    });

    it('should return null if token is invalid', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue(null);

      const result = await authService.validateToken('invalid_token');

      expect(jwtService.verifyToken).toHaveBeenCalledWith('invalid_token');
      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      (jwtService.verifyToken as jest.Mock).mockReturnValue({ userId: 'nonexistent-id' });
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await authService.validateToken('valid_token');

      expect(jwtService.verifyToken).toHaveBeenCalledWith('valid_token');
      expect(userRepository.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(result).toBeNull();
    });
  });
});
