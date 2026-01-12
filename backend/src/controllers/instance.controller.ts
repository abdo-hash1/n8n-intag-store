/**
 * Instance Controller
 * Handles HTTP requests for n8n Docker instance management
 */

import { Request, Response, NextFunction } from 'express';
import { provisioningService } from '../services/provisioning/index.js';
import { sendSuccess, sendCreated, BadRequestError } from '../utils/index.js';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * POST /api/instance/provision
 * Provision a new n8n instance for the current user
 */
export async function provisionInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        // Check if user has an active subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId: req.user.id,
                status: 'active',
            },
        });

        if (!subscription) {
            throw new BadRequestError('Active subscription required to provision an instance');
        }

        const result = await provisioningService.provisionInstance(req.user.id);

        if (!result.success) {
            throw new BadRequestError(result.error || 'Failed to provision instance');
        }

        sendCreated(res, {
            instanceUrl: result.instanceUrl,
            status: 'provisioned',
        }, 'n8n instance provisioned successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/instance/status
 * Get current user's instance status
 */
export async function getInstanceStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        const status = await provisioningService.getInstanceStatus(req.user.id);

        if (!status) {
            sendSuccess(res, { hasInstance: false }, 'No instance found');
            return;
        }

        sendSuccess(res, {
            hasInstance: true,
            ...status,
        }, 'Instance status retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/instance/resume
 * Resume a suspended n8n instance
 */
export async function resumeInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        // Check if user has an active subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId: req.user.id,
                status: 'active',
            },
        });

        if (!subscription) {
            throw new BadRequestError('Active subscription required to resume instance');
        }

        const result = await provisioningService.resumeInstance(req.user.id);

        if (!result.success) {
            throw new BadRequestError(result.error || 'Failed to resume instance');
        }

        sendSuccess(res, {
            instanceUrl: result.instanceUrl,
            status: 'active',
        }, 'Instance resumed successfully');
    } catch (error) {
        next(error);
    }
}

// ===================================
// Admin Functions
// ===================================

/**
 * GET /api/instance/admin/list
 * Admin: Get all n8n instances with pagination
 */
export async function adminGetAllInstances(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const search = req.query.search as string;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Record<string, unknown> = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { subdomain: { contains: search } },
                { user: { email: { contains: search } } },
                { user: { fullName: { contains: search } } },
            ];
        }

        const [instances, total] = await Promise.all([
            prisma.n8nInstance.findMany({
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
            prisma.n8nInstance.count({ where }),
        ]);

        // Add instanceUrl to each instance
        const instancesWithUrl = instances.map((instance) => ({
            ...instance,
            instanceUrl: instance.status !== 'deleted'
                ? `https://${instance.subdomain}.${process.env.N8N_DOMAIN || 'n8n.speak25.online'}`
                : null,
        }));

        sendSuccess(res, {
            instances: instancesWithUrl,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, 'Instances retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/instance/admin/stats
 * Admin: Get instance statistics
 */
export async function adminGetInstanceStats(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const [
            total,
            active,
            suspended,
            provisioning,
            error,
            deleted,
        ] = await Promise.all([
            prisma.n8nInstance.count(),
            prisma.n8nInstance.count({ where: { status: 'active' } }),
            prisma.n8nInstance.count({ where: { status: 'suspended' } }),
            prisma.n8nInstance.count({ where: { status: 'provisioning' } }),
            prisma.n8nInstance.count({ where: { status: 'error' } }),
            prisma.n8nInstance.count({ where: { status: 'deleted' } }),
        ]);

        sendSuccess(res, {
            total,
            active,
            suspended,
            provisioning,
            error,
            deleted,
            running: active, // Alias for dashboard
        }, 'Instance statistics retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/instance/admin/:userId
 * Admin: Get a user's instance details
 */
export async function adminGetInstanceStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;

        const instance = await prisma.n8nInstance.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
                provisioningLogs: {
                    orderBy: { startedAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!instance) {
            sendSuccess(res, { hasInstance: false }, 'No instance found');
            return;
        }

        sendSuccess(res, {
            hasInstance: true,
            ...instance,
            instanceUrl: instance.status !== 'deleted'
                ? `https://${instance.subdomain}.${process.env.N8N_DOMAIN || 'n8n.speak25.online'}`
                : null,
        }, 'Instance status retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/instance/admin/:userId/provision
 * Admin: Provision an instance for a user
 */
export async function adminProvisionInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;

        logger.info(`Admin provisioning instance for user ${userId}`);

        const result = await provisioningService.provisionInstance(userId);

        if (!result.success) {
            throw new BadRequestError(result.error || 'Failed to provision instance');
        }

        sendCreated(res, {
            instanceUrl: result.instanceUrl,
            status: 'provisioned',
        }, 'Instance provisioned for user');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/instance/admin/:userId/suspend
 * Admin: Suspend a user's instance
 */
export async function adminSuspendInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;

        logger.info(`Admin suspending instance for user ${userId}`);

        const result = await provisioningService.suspendInstance(userId);

        if (!result.success) {
            throw new BadRequestError(result.error || 'Failed to suspend instance');
        }

        sendSuccess(res, { status: 'suspended' }, 'Instance suspended');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/instance/admin/:userId/resume
 * Admin: Resume a user's suspended instance
 */
export async function adminResumeInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;

        logger.info(`Admin resuming instance for user ${userId}`);

        const result = await provisioningService.resumeInstance(userId);

        if (!result.success) {
            throw new BadRequestError(result.error || 'Failed to resume instance');
        }

        sendSuccess(res, {
            instanceUrl: result.instanceUrl,
            status: 'active',
        }, 'Instance resumed');
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/instance/admin/:userId
 * Admin: Delete a user's instance
 */
export async function adminDeleteInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;

        logger.info(`Admin deleting instance for user ${userId}`);

        const result = await provisioningService.deleteInstance(userId);

        if (!result.success) {
            throw new BadRequestError(result.error || 'Failed to delete instance');
        }

        sendSuccess(res, { status: 'deleted' }, 'Instance deleted');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/instance/admin/:instanceId/logs
 * Admin: Get provisioning logs for an instance
 */
export async function adminGetInstanceLogs(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { instanceId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const logs = await prisma.provisioningLog.findMany({
            where: { instanceId },
            orderBy: { startedAt: 'desc' },
            take: limit,
        });

        sendSuccess(res, { logs }, 'Provisioning logs retrieved');
    } catch (error) {
        next(error);
    }
}
