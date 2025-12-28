/**
 * Activity Log Service
 * Tracks all important actions in the system
 */

import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

interface LogData {
    userId?: string;
    subscriptionId?: string;
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

class ActivityLogService {
    /**
     * Log an activity
     */
    async log(data: LogData): Promise<void> {
        try {
            await prisma.activityLog.create({
                data: {
                    userId: data.userId,
                    subscriptionId: data.subscriptionId,
                    action: data.action,
                    details: data.details ? JSON.stringify(data.details) : null,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                },
            });
        } catch (error) {
            // Don't throw - logging should never break the main flow
            logger.error('Failed to log activity:', { error, data });
        }
    }

    /**
     * Get activity logs for a user
     */
    async getUserLogs(
        userId: string,
        options: { page?: number; limit?: number } = {}
    ) {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.activityLog.count({ where: { userId } }),
        ]);

        return { logs, total, page, limit };
    }

    /**
     * Get recent logs for admin dashboard
     */
    async getRecentLogs(limit: number = 20) {
        return prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });
    }

    /**
     * Get logs by action type
     */
    async getLogsByAction(
        action: string,
        options: { page?: number; limit?: number } = {}
    ) {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where: { action },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                },
            }),
            prisma.activityLog.count({ where: { action } }),
        ]);

        return { logs, total, page, limit };
    }
}

export const activityLogService = new ActivityLogService();
