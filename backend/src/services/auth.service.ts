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

        // Send welcome email and verification email
        try {
            const { emailService } = await import('./email.service.js');
            await emailService.sendWelcome(user.email, user.fullName);

            // Also send email verification
            const { userService } = await import('./user.service.js');
            await userService.requestEmailVerification(user.id, ipAddress);
        } catch (error) {
            logger.error('Failed to send welcome/verification email:', error);
        }

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

    /**
     * Request password reset
     * Generates a reset token and sends email
     */
    async requestPasswordReset(email: string, ipAddress?: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, email: true, fullName: true, status: true },
        });

        // Always return success to prevent email enumeration
        if (!user || user.status !== 'active') {
            logger.info(`Password reset requested for non-existent/inactive email: ${email}`);
            return;
        }

        // Generate reset token (use crypto for secure random token)
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store hashed token in system settings (or a dedicated table)
        // Using system settings as a simple key-value store
        await prisma.systemSetting.upsert({
            where: { key: `password_reset_${user.id}` },
            update: {
                value: JSON.stringify({
                    tokenHash: resetTokenHash,
                    expiry: resetTokenExpiry.toISOString(),
                }),
            },
            create: {
                key: `password_reset_${user.id}`,
                value: JSON.stringify({
                    tokenHash: resetTokenHash,
                    expiry: resetTokenExpiry.toISOString(),
                }),
            },
        });

        // Send email with reset link
        try {
            const { emailService } = await import('./email.service.js');
            await emailService.sendPasswordReset(user.email, user.fullName, resetToken);
        } catch (error) {
            logger.error('Failed to send password reset email:', error);
        }

        // Log activity
        await activityLogService.log({
            userId: user.id,
            action: 'password_reset_requested',
            details: {},
            ipAddress,
        });

        logger.info(`Password reset requested for: ${user.email}`);
    }

    /**
     * Verify password reset token
     */
    async verifyResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
        const crypto = await import('crypto');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find matching token in system settings
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { startsWith: 'password_reset_' },
            },
        });

        for (const setting of settings) {
            try {
                const data = JSON.parse(setting.value);
                if (data.tokenHash === tokenHash) {
                    // Check expiry
                    if (new Date(data.expiry) < new Date()) {
                        // Token expired, clean up
                        await prisma.systemSetting.delete({ where: { id: setting.id } });
                        return { valid: false };
                    }

                    const userId = setting.key.replace('password_reset_', '');
                    return { valid: true, userId };
                }
            } catch {
                continue;
            }
        }

        return { valid: false };
    }

    /**
     * Reset password with token
     */
    async resetPassword(
        token: string,
        newPassword: string,
        ipAddress?: string
    ): Promise<void> {
        const { valid, userId } = await this.verifyResetToken(token);

        if (!valid || !userId) {
            throw new BadRequestError('Invalid or expired reset token');
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });

        if (!user) {
            throw new BadRequestError('User not found');
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Delete reset token
        await prisma.systemSetting.deleteMany({
            where: { key: `password_reset_${userId}` },
        });

        // Log activity
        await activityLogService.log({
            userId,
            action: 'password_reset_completed',
            details: {},
            ipAddress,
        });

        logger.info(`Password reset completed for: ${user.email}`);
    }
}

export const authService = new AuthService();
