/**
 * Subscription Service
 * Business logic for subscription management
 */

import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
} from '../utils/index.js';
import { activityLogService } from './activityLog.service.js';

// Types
interface CreateSubscriptionData {
    userId: string;
    planType: 'monthly' | 'yearly';
    paymentGateway?: string;
    gatewayTransactionId?: string;
}

interface UpdateSubscriptionData {
    status?: string;
    planType?: string;
    amount?: number;
}

class SubscriptionService {
    /**
     * Create a new subscription for a user
     */
    async createSubscription(
        data: CreateSubscriptionData,
        ipAddress?: string
    ) {
        const { userId, planType, paymentGateway, gatewayTransactionId } = data;

        // Check if user already has an active subscription
        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: { in: ['active', 'paused'] },
            },
        });

        if (existingSubscription) {
            throw new ConflictError('User already has an active subscription');
        }

        // Calculate dates and amount
        const now = new Date();
        const amount = planType === 'yearly'
            ? config.pricing.annual
            : config.pricing.monthly;

        const periodEnd = new Date(now);
        if (planType === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Create subscription
        const subscription = await prisma.subscription.create({
            data: {
                userId,
                planType,
                status: 'active',
                amount,
                currency: config.pricing.currency,
                paymentGateway: paymentGateway || null,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                nextBillingDate: periodEnd,
            },
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

        // Create payment record
        await prisma.payment.create({
            data: {
                subscriptionId: subscription.id,
                userId,
                paymentGateway: paymentGateway || 'manual',
                gatewayTransactionId: gatewayTransactionId || `manual_${Date.now()}`,
                amount,
                currency: config.pricing.currency,
                status: 'success',
            },
        });

        // Log activity
        await activityLogService.log({
            userId,
            subscriptionId: subscription.id,
            action: 'subscription_created',
            details: { planType, amount },
            ipAddress,
        });

        logger.info(`Subscription created for user ${userId}: ${planType}`);

        return subscription;
    }

    /**
     * Get subscription by ID
     */
    async getById(subscriptionId: string) {
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true,
                    },
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!subscription) {
            throw new NotFoundError('Subscription not found');
        }

        return subscription;
    }

    /**
     * Get user's active subscription
     */
    async getUserActiveSubscription(userId: string) {
        return prisma.subscription.findFirst({
            where: {
                userId,
                status: { in: ['active', 'paused', 'payment_failed'] },
            },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });
    }

    /**
     * Pause a subscription
     */
    async pauseSubscription(
        subscriptionId: string,
        reason: string,
        userId: string,
        ipAddress?: string
    ) {
        const subscription = await this.getById(subscriptionId);

        if (subscription.status !== 'active') {
            throw new BadRequestError('Only active subscriptions can be paused');
        }

        if (subscription.userId !== userId) {
            throw new BadRequestError('You can only pause your own subscription');
        }

        const updated = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'paused',
                pausedAt: new Date(),
                pauseReason: reason,
            },
        });

        // Log activity
        await activityLogService.log({
            userId,
            subscriptionId,
            action: 'subscription_paused',
            details: { reason },
            ipAddress,
        });

        logger.info(`Subscription paused: ${subscriptionId}`);

        return updated;
    }

    /**
     * Resume a paused subscription
     */
    async resumeSubscription(
        subscriptionId: string,
        userId: string,
        ipAddress?: string
    ) {
        const subscription = await this.getById(subscriptionId);

        if (subscription.status !== 'paused') {
            throw new BadRequestError('Only paused subscriptions can be resumed');
        }

        if (subscription.userId !== userId) {
            throw new BadRequestError('You can only resume your own subscription');
        }

        // Calculate new dates based on remaining time
        const pausedAt = subscription.pausedAt || new Date();
        const pauseDuration = Date.now() - pausedAt.getTime();
        const newPeriodEnd = new Date(subscription.currentPeriodEnd.getTime() + pauseDuration);
        const newBillingDate = subscription.nextBillingDate
            ? new Date(subscription.nextBillingDate.getTime() + pauseDuration)
            : newPeriodEnd;

        const updated = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'active',
                pausedAt: null,
                pauseReason: null,
                resumeDate: new Date(),
                currentPeriodEnd: newPeriodEnd,
                nextBillingDate: newBillingDate,
            },
        });

        // Log activity
        await activityLogService.log({
            userId,
            subscriptionId,
            action: 'subscription_resumed',
            details: { newPeriodEnd: newPeriodEnd.toISOString() },
            ipAddress,
        });

        logger.info(`Subscription resumed: ${subscriptionId}`);

        return updated;
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(
        subscriptionId: string,
        reason: string,
        userId: string,
        ipAddress?: string
    ) {
        const subscription = await this.getById(subscriptionId);

        if (['cancelled', 'expired'].includes(subscription.status)) {
            throw new BadRequestError('Subscription is already cancelled or expired');
        }

        if (subscription.userId !== userId) {
            throw new BadRequestError('You can only cancel your own subscription');
        }

        const updated = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelReason: reason,
            },
        });

        // Log activity
        await activityLogService.log({
            userId,
            subscriptionId,
            action: 'subscription_cancelled',
            details: { reason },
            ipAddress,
        });

        logger.info(`Subscription cancelled: ${subscriptionId}`);

        return updated;
    }

    /**
     * Change subscription plan (upgrade/downgrade)
     */
    async changePlan(
        subscriptionId: string,
        newPlanType: 'monthly' | 'yearly',
        userId: string,
        ipAddress?: string
    ) {
        const subscription = await this.getById(subscriptionId);

        if (subscription.status !== 'active') {
            throw new BadRequestError('Only active subscriptions can change plan');
        }

        if (subscription.userId !== userId) {
            throw new BadRequestError('You can only change your own subscription plan');
        }

        if (subscription.planType === newPlanType) {
            throw new BadRequestError('Already on this plan');
        }

        const newAmount = newPlanType === 'yearly'
            ? config.pricing.annual
            : config.pricing.monthly;

        // Calculate new period end
        const now = new Date();
        const newPeriodEnd = new Date(now);
        if (newPlanType === 'yearly') {
            newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
        } else {
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        }

        const updated = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                planType: newPlanType,
                amount: newAmount,
                currentPeriodStart: now,
                currentPeriodEnd: newPeriodEnd,
                nextBillingDate: newPeriodEnd,
            },
        });

        // Log activity
        await activityLogService.log({
            userId,
            subscriptionId,
            action: 'subscription_plan_changed',
            details: {
                oldPlan: subscription.planType,
                newPlan: newPlanType,
                oldAmount: subscription.amount,
                newAmount,
            },
            ipAddress,
        });

        logger.info(`Subscription plan changed: ${subscriptionId} to ${newPlanType}`);

        return updated;
    }

    /**
     * Get all subscriptions (admin)
     */
    async getAllSubscriptions(options: {
        page?: number;
        limit?: number;
        status?: string;
        planType?: string;
        search?: string;
    } = {}) {
        const { page = 1, limit = 20, status, planType, search } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (status) {
            where.status = status;
        }

        if (planType) {
            where.planType = planType;
        }

        if (search) {
            where.user = {
                OR: [
                    { email: { contains: search } },
                    { fullName: { contains: search } },
                ],
            };
        }

        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.subscription.count({ where }),
        ]);

        return { subscriptions, total, page, limit };
    }

    /**
     * Get subscription statistics (admin)
     */
    async getStatistics() {
        const [
            totalSubscriptions,
            activeSubscriptions,
            pausedSubscriptions,
            cancelledSubscriptions,
            monthlySubscriptions,
            yearlySubscriptions,
        ] = await Promise.all([
            prisma.subscription.count(),
            prisma.subscription.count({ where: { status: 'active' } }),
            prisma.subscription.count({ where: { status: 'paused' } }),
            prisma.subscription.count({ where: { status: 'cancelled' } }),
            prisma.subscription.count({ where: { planType: 'monthly', status: 'active' } }),
            prisma.subscription.count({ where: { planType: 'yearly', status: 'active' } }),
        ]);

        // Calculate MRR (Monthly Recurring Revenue)
        const monthlyRevenue = monthlySubscriptions * config.pricing.monthly;
        const yearlyMonthlyEquivalent = yearlySubscriptions * (config.pricing.annual / 12);
        const mrr = monthlyRevenue + yearlyMonthlyEquivalent;

        return {
            total: totalSubscriptions,
            active: activeSubscriptions,
            paused: pausedSubscriptions,
            cancelled: cancelledSubscriptions,
            byPlan: {
                monthly: monthlySubscriptions,
                yearly: yearlySubscriptions,
            },
            mrr,
            currency: config.pricing.currency,
        };
    }

    /**
     * Admin: Update subscription manually
     */
    async adminUpdateSubscription(
        subscriptionId: string,
        data: UpdateSubscriptionData,
        adminId: string,
        ipAddress?: string
    ) {
        const subscription = await this.getById(subscriptionId);

        const updated = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: data.status || subscription.status,
                planType: data.planType || subscription.planType,
                amount: data.amount || subscription.amount,
            },
        });

        // Log activity
        await activityLogService.log({
            userId: adminId,
            subscriptionId,
            action: 'admin_subscription_updated',
            details: { changes: data },
            ipAddress,
        });

        logger.info(`Admin updated subscription: ${subscriptionId}`);

        return updated;
    }
}

export const subscriptionService = new SubscriptionService();
