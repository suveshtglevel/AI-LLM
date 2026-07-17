import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { AuthModel } from '../modules/auth/auth.model';

// Mock Mongoose model
const mockFindOne = jest.fn<any>();
const mockFindById = jest.fn<any>();
const mockSave = jest.fn<any>();
const mockCreate = jest.fn<any>();

jest.mock('../modules/auth/user.model', () => ({
  User: Object.assign(
    jest.fn(() => ({ save: mockSave })),
    {
      findOne: (...args: any[]) => mockFindOne(...args),
      findById: (...args: any[]) => mockFindById(...args),
      create: (...args: any[]) => mockCreate(...args),
    }
  ),
}));

jest.mock('../utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: jest.fn(() => ({
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'USER',
  })),
}));

const mockUser = {
  _id: 'test-user-id',
  id: 'test-user-id',
  email: 'test@example.com',
  password: 'hashed-password',
  name: 'Test User',
  role: 'USER',
  refreshToken: null,
  save: mockSave,
};

describe('AuthModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockResolvedValue(null);
    mockFindById.mockReturnValue({ select: jest.fn<any>().mockResolvedValue(mockUser as any) });
    mockCreate.mockResolvedValue(mockUser);
    mockSave.mockResolvedValue(mockUser);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockCreate.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const result = await AuthModel.register('test@example.com', 'password123', 'Test User');

      expect(result).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBe('mock-refresh-token');
    });

    it('should throw error if email already exists', async () => {
      mockFindOne.mockResolvedValue(mockUser);

      await expect(
        AuthModel.register('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockFindOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await AuthModel.login('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('should throw error with invalid password', async () => {
      mockFindOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        AuthModel.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if user not found', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(
        AuthModel.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profile = await AuthModel.getProfile('test-user-id');
      expect(profile).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      mockFindById.mockReturnValue({ select: jest.fn<any>().mockResolvedValue(null as any) });

      await expect(
        AuthModel.getProfile('nonexistent-id')
      ).rejects.toThrow('User not found');
    });
  });
});
