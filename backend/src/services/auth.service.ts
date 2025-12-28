/**
 * Authentication Service
 * Business logic for user authentication
 */

import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import {
    hashPassword,
    comparePassword,
    generateTokenPair,
    BadRequestError,
    UnauthorizedError,
    ConflictError,
    type TokenPayload,
} from '../utils/index.js';
import { activityLogService } from './activityLog.service.js';

// Types
interface SignupData {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface AuthResponse {
    user: {
        id: string;
        email: string;
        fullName: string;
        role: string;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
}

class AuthService {
    /**
     * Register a new user
     */
    async signup(data: SignupData, ipAddress?: string): Promise<AuthResponse> {
        const { email, password, fullName, phone } = data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictError('An account with this email already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                fullName,
                phone,
                role: 'user',
                status: 'active',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
            },
        });

        // Generate tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const tokens = generateTokenPair(tokenPayload);

        // Log activity
        await activityLogService.log({
            userId: user.id,
            action: 'user_signup',
            details: { email: user.email },
            ipAddress,
        });

        logger.info(`New user registered: ${user.email}`);

        return {
            user,
            tokens,
        };
    }

    /**
     * Login a user
     */
    async login(data: LoginData, ipAddress?: string): Promise<AuthResponse> {
        const { email, password } = data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                password: true,
                fullName: true,
                role: true,
                status: true,
            },
        });

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Check password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            // Log failed attempt
            await activityLogService.log({
                userId: user.id,
                action: 'login_failed',
                details: { reason: 'Invalid password' },
                ipAddress,
            });
            throw new UnauthorizedError('Invalid email or password');
        }

        // Check if user is active
        if (user.status !== 'active') {
            throw new UnauthorizedError(
                user.status === 'suspended'
                    ? 'Your account has been suspended. Please contact support.'
                    : 'Your account is not active'
            );
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const tokens = generateTokenPair(tokenPayload);

        // Log activity
        await activityLogService.log({
            userId: user.id,
            action: 'user_login',
            details: {},
            ipAddress,
        });

        logger.info(`User logged in: ${user.email}`);

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
            tokens,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(
        refreshToken: string,
        ipAddress?: string
    ): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
        // Import here to avoid circular dependency
        const { verifyRefreshToken } = await import('../utils/jwt.js');

        try {
            const decoded = verifyRefreshToken(refreshToken);

            // Verify user still exists and is active
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                },
            });

            if (!user || user.status !== 'active') {
                throw new UnauthorizedError('User not found or inactive');
            }

            // Generate new tokens
            const tokenPayload: TokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
            };

            return generateTokenPair(tokenPayload);
        } catch (error) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }
    }

    /**
     * Logout (if we want to track it)
     */
    async logout(userId: string, ipAddress?: string): Promise<void> {
        await activityLogService.log({
            userId,
            action: 'user_logout',
            details: {},
            ipAddress,
        });

        logger.info(`User logged out: ${userId}`);
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                status: true,
                instanceUrl: true,
                createdAt: true,
                lastLoginAt: true,
                emailNotifications: true,
                marketingEmails: true,
            },
        });

        return user;
    }
}

export const authService = new AuthService();
