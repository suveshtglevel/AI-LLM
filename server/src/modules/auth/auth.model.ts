import bcrypt from 'bcryptjs';
import { logger } from '../../config/logger';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../utils/helpers';
import { AuthResponse, TokenPayload } from '../../types';
import { User } from './user.model';

export class AuthModel {
  static async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword, name });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    logger.info(`User registered: ${user.email}`);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens: { accessToken, refreshToken },
    };
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens: { accessToken, refreshToken },
    };
  }

  static async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) {
      throw new AppError('Invalid refresh token', 401);
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }

  static async getProfile(userId: string) {
    const user = await User.findById(userId).select('email name role createdAt');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}
