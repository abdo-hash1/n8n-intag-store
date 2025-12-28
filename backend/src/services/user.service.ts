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
                instanceUrl: true,
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
                instanceUrl: true,
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
            details: data,
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
}

export const userService = new UserService();
