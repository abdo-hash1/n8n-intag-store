/**
 * User Service
 * Business logic for user management
 */

import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import {
    hashPassword,
    comparePassword,
    NotFoundError,
    BadRequestError,
} from '../utils/index.js';
import { activityLogService } from './activityLog.service.js';

interface UpdateProfileData {
    fullName?: string;
    phone?: string;
}

interface UpdatePreferencesData {
    emailNotifications?: boolean;
    marketingEmails?: boolean;
}

class UserService {
    /**
     * Get user profile
     */
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                emailNotifications: true,
                marketingEmails: true,
            },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, data: UpdateProfileData, ipAddress?: string) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName: data.fullName,
                phone: data.phone,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                emailNotifications: true,
                marketingEmails: true,
            },
        });

        // Log activity
        await activityLogService.log({
            userId,
            action: 'profile_updated',
            details: { updatedFields: Object.keys(data) },
            ipAddress,
        });

        logger.info(`User profile updated: ${userId}`);

        return user;
    }

    /**
     * Change user password
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
        ipAddress?: string
    ): Promise<void> {
        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Log activity
        await activityLogService.log({
            userId,
            action: 'password_changed',
            details: {},
            ipAddress,
        });

        logger.info(`User password changed: ${userId}`);
    }

    /**
     * Update email preferences
     */
    async updatePreferences(
        userId: string,
        data: UpdatePreferencesData,
        ipAddress?: string
    ) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                emailNotifications: data.emailNotifications,
                marketingEmails: data.marketingEmails,
            },
            select: {
                id: true,
                emailNotifications: true,
                marketingEmails: true,
            },
        });

        // Log activity
        await activityLogService.log({
            userId,
            action: 'preferences_updated',
            details: data as Record<string, unknown>,
            ipAddress,
        });

        return user;
    }

    /**
     * Get user's active subscription
     */
    async getActiveSubscription(userId: string) {
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: { in: ['active', 'paused', 'payment_failed'] },
            },
            orderBy: { createdAt: 'desc' },
        });

        return subscription;
    }

    /**
     * Get user's activity log
     */
    async getActivityLog(userId: string, page: number = 1, limit: number = 20) {
        return activityLogService.getUserLogs(userId, { page, limit });
    }

    /**
     * Request email verification
     * Generates a verification token and sends email
     */
    async requestEmailVerification(userId: string, ipAddress?: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, fullName: true, emailVerified: true },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.emailVerified) {
            throw new BadRequestError('Email is already verified');
        }

        // Generate verification token
        const crypto = await import('crypto');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store hashed token
        await prisma.systemSetting.upsert({
            where: { key: `email_verify_${userId}` },
            update: {
                value: JSON.stringify({
                    tokenHash,
                    expiry: tokenExpiry.toISOString(),
                }),
            },
            create: {
                key: `email_verify_${userId}`,
                value: JSON.stringify({
                    tokenHash,
                    expiry: tokenExpiry.toISOString(),
                }),
            },
        });

        // Send verification email
        try {
            const { emailService } = await import('./email.service.js');
            await emailService.sendEmailVerification(user.email, user.fullName, verificationToken);
        } catch (error) {
            logger.error('Failed to send verification email:', error);
        }

        // Log activity
        await activityLogService.log({
            userId,
            action: 'email_verification_requested',
            details: {},
            ipAddress,
        });

        logger.info(`Email verification requested for: ${user.email}`);
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string, ipAddress?: string): Promise<{ success: boolean; message: string }> {
        const crypto = await import('crypto');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find matching token
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { startsWith: 'email_verify_' },
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
                        return { success: false, message: 'Verification link has expired' };
                    }

                    const userId = setting.key.replace('email_verify_', '');

                    // Mark email as verified
                    await prisma.user.update({
                        where: { id: userId },
                        data: { emailVerified: true },
                    });

                    // Delete verification token
                    await prisma.systemSetting.delete({ where: { id: setting.id } });

                    // Log activity
                    await activityLogService.log({
                        userId,
                        action: 'email_verified',
                        details: {},
                        ipAddress,
                    });

                    logger.info(`Email verified for user: ${userId}`);

                    return { success: true, message: 'Email verified successfully' };
                }
            } catch {
                continue;
            }
        }

        return { success: false, message: 'Invalid verification link' };
    }

    /**
     * Check if email is verified
     */
    async isEmailVerified(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { emailVerified: true },
        });

        return user?.emailVerified ?? false;
    }

    /**
     * Get user's payment history
     */
    async getPayments(userId: string) {
        const payments = await prisma.payment.findMany({
            where: { userId },
            include: {
                subscription: {
                    select: { planType: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return payments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.paymentGateway,
            transactionId: payment.gatewayTransactionId,
            createdAt: payment.createdAt,
            subscription: payment.subscription,
        }));
    }
}

export const userService = new UserService();
