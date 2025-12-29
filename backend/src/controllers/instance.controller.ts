/**
 * Instance Controller
 * Handles HTTP requests for n8n Docker instance management
 */

import { Request, Response, NextFunction } from 'express';
import { dockerService } from '../services/index.js';
import { sendSuccess, sendCreated, BadRequestError } from '../utils/index.js';
import { prisma } from '../config/database.js';

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

        const ipAddress = req.ip || req.socket.remoteAddress;

        const result = await dockerService.provisionInstance({
            userId: req.user.id,
        }, ipAddress);

        sendCreated(res, {
            containerId: result.containerId,
            instanceUrl: result.instanceUrl,
            status: result.status,
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

        const status = await dockerService.getInstanceStatus(req.user.id);

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
 * POST /api/instance/start
 * Start the user's n8n instance
 */
export async function startInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const result = await dockerService.startInstance(req.user.id, ipAddress);

        sendSuccess(res, result, 'Instance started successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/instance/stop
 * Stop the user's n8n instance
 */
export async function stopInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        await dockerService.stopInstance(req.user.id, ipAddress);

        sendSuccess(res, { status: 'stopped' }, 'Instance stopped successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/instance/restart
 * Restart the user's n8n instance
 */
export async function restartInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const result = await dockerService.restartInstance(req.user.id, ipAddress);

        sendSuccess(res, result, 'Instance restarted successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/instance/logs
 * Get instance logs
 */
export async function getInstanceLogs(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
        const logs = await dockerService.getInstanceLogs(req.user.id, lines);

        sendSuccess(res, { logs }, 'Instance logs retrieved');
    } catch (error) {
        next(error);
    }
}

// Admin functions

/**
 * POST /api/instance/admin/:userId/provision
 * Admin provision an instance for a user
 */
export async function adminProvisionInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const result = await dockerService.provisionInstance({ userId }, ipAddress);

        sendCreated(res, result, 'Instance provisioned for user');
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/instance/admin/:userId
 * Admin destroy a user's instance
 */
export async function adminDestroyInstance(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;
        const ipAddress = req.ip || req.socket.remoteAddress;

        await dockerService.destroyInstance(userId, ipAddress);

        sendSuccess(res, { destroyed: true }, 'Instance destroyed');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/instance/admin/:userId/status
 * Admin get a user's instance status
 */
export async function adminGetInstanceStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;

        const status = await dockerService.getInstanceStatus(userId);

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
