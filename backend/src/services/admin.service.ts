/**
 * Admin Service
 * Business logic for admin panel operations
 */

import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { NotFoundError, BadRequestError } from '../utils/index.js';
import { activityLogService } from './activityLog.service.js';
import { hashPassword } from '../utils/helpers.js';

class AdminService {
    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            totalUsers,
            activeUsers,
            newUsersThisMonth,
            newUsersLastMonth,
            totalSubscriptions,
            activeSubscriptions,
            totalRevenue,
            revenueThisMonth,
            openTickets,
            pendingRefunds,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'active' } }),
            prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: startOfLastMonth,
                        lt: startOfMonth
                    }
                }
            }),
            prisma.subscription.count(),
            prisma.subscription.count({ where: { status: 'active' } }),
            prisma.payment.aggregate({
                where: { status: 'success' },
                _sum: { amount: true },
            }),
            prisma.payment.aggregate({
                where: {
                    status: 'success',
                    createdAt: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),
            prisma.supportTicket.count({ where: { status: 'open' } }),
            prisma.refundRequest.count({ where: { status: 'pending' } }),
        ]);

        // Calculate growth rate
        const userGrowthRate = newUsersLastMonth > 0
            ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
            : 100;

        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                newThisMonth: newUsersThisMonth,
                growthRate: Math.round(userGrowthRate * 10) / 10,
            },
            subscriptions: {
                total: totalSubscriptions,
                active: activeSubscriptions,
            },
            revenue: {
                total: totalRevenue._sum.amount || 0,
                thisMonth: revenueThisMonth._sum.amount || 0,
                currency: 'EGP',
            },
            support: {
                openTickets,
                pendingRefunds,
            },
        };
    }

    /**
     * Get all users with pagination
     */
    async getAllUsers(options: {
        page?: number;
        limit?: number;
        status?: string;
        role?: string;
        search?: string;
    } = {}) {
        const { page = 1, limit = 20, status, role, search } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (status) where.status = status;
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { fullName: { contains: search } },
                { phone: { contains: search } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
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
                    _count: {
                        select: {
                            subscriptions: true,
                            supportTickets: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.user.count({ where }),
        ]);

        return { users, total, page, limit };
    }

    /**
     * Get user details for admin
     */
    async getUserDetails(userId: string) {
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
                containerId: true,
                emailVerified: true,
                createdAt: true,
                lastLoginAt: true,
                emailNotifications: true,
                marketingEmails: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        planType: true,
                        status: true,
                        amount: true,
                        currentPeriodEnd: true,
                    },
                },
                supportTickets: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        subject: true,
                        status: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        subscriptions: true,
                        supportTickets: true,
                        payments: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    /**
     * Update user status (suspend, activate, delete)
     */
    async updateUserStatus(
        userId: string,
        newStatus: 'active' | 'suspended' | 'deleted',
        adminId: string,
        ipAddress?: string
    ) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, status: true, role: true },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.role === 'super_admin') {
            throw new BadRequestError('Cannot modify super admin status');
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { status: newStatus },
            select: {
                id: true,
                email: true,
                fullName: true,
                status: true,
            },
        });

        // Log activity
        await activityLogService.log({
            userId: adminId,
            action: 'admin_user_status_changed',
            details: {
                targetUserId: userId,
                targetEmail: user.email,
                oldStatus: user.status,
                newStatus,
            },
            ipAddress,
        });

        logger.info(`Admin ${adminId} changed user ${userId} status to ${newStatus}`);

        return updated;
    }

    /**
     * Update user role
     */
    async updateUserRole(
        userId: string,
        newRole: 'user' | 'admin' | 'support_agent',
        adminId: string,
        ipAddress?: string
    ) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.role === 'super_admin') {
            throw new BadRequestError('Cannot modify super admin role');
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
            },
        });

        // Log activity
        await activityLogService.log({
            userId: adminId,
            action: 'admin_user_role_changed',
            details: {
                targetUserId: userId,
                targetEmail: user.email,
                oldRole: user.role,
                newRole,
            },
            ipAddress,
        });

        logger.info(`Admin ${adminId} changed user ${userId} role to ${newRole}`);

        return updated;
    }

    /**
     * Create new admin user
     */
    async createAdminUser(
        data: {
            email: string;
            password: string;
            fullName: string;
            role: 'admin' | 'support_agent';
        },
        adminId: string,
        ipAddress?: string
    ) {
        // Check if email exists
        const existing = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (existing) {
            throw new BadRequestError('Email already exists');
        }

        const hashedPassword = await hashPassword(data.password);

        const user = await prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                password: hashedPassword,
                fullName: data.fullName,
                role: data.role,
                status: 'active',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
            },
        });

        // Log activity
        await activityLogService.log({
            userId: adminId,
            action: 'admin_user_created',
            details: {
                newUserId: user.id,
                email: user.email,
                role: user.role,
            },
            ipAddress,
        });

        logger.info(`Admin ${adminId} created new ${data.role}: ${user.email}`);

        return user;
    }

    /**
     * Get recent activity logs
     */
    async getRecentActivity(limit: number = 50) {
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
     * Get all payments with pagination
     */
    async getAllPayments(options: {
        page?: number;
        limit?: number;
        status?: string;
    } = {}) {
        const { page = 1, limit = 20, status } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (status) where.status = status;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    subscription: {
                        select: {
                            id: true,
                            planType: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.payment.count({ where }),
        ]);

        return { payments, total, page, limit };
    }

    /**
     * Get system settings
     */
    async getSystemSettings() {
        const settings = await prisma.systemSetting.findMany();
        return settings.reduce((acc, setting) => {
            acc[setting.key] = JSON.parse(setting.value);
            return acc;
        }, {} as Record<string, unknown>);
    }

    /**
     * Update system setting
     */
    async updateSystemSetting(
        key: string,
        value: unknown,
        adminId: string,
        ipAddress?: string
    ) {
        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: JSON.stringify(value) },
            create: { key, value: JSON.stringify(value) },
        });

        // Log activity
        await activityLogService.log({
            userId: adminId,
            action: 'admin_setting_updated',
            details: { key, value },
            ipAddress,
        });

        return setting;
    }
}

export const adminService = new AdminService();
