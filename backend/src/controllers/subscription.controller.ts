/**
 * Subscription Controller
 * Handles HTTP requests for subscription endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/index.js';
import { sendSuccess, sendCreated, NotFoundError } from '../utils/index.js';

/**
 * POST /api/subscription
 * Create a new subscription
 */
export async function createSubscription(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { planType } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const subscription = await subscriptionService.createSubscription(
            {
                userId: req.user.id,
                planType,
            },
            ipAddress
        );

        sendCreated(res, { subscription }, 'Subscription created successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/subscription
 * Get user's active subscription
 */
export async function getMySubscription(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const subscription = await subscriptionService.getUserActiveSubscription(req.user.id);

        sendSuccess(res, { subscription }, 'Subscription retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/subscription/:subscriptionId
 * Get subscription details
 */
export async function getSubscriptionDetails(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { subscriptionId } = req.params;
        const subscription = await subscriptionService.getById(subscriptionId);

        // Verify ownership
        if (subscription.userId !== req.user?.id) {
            throw new NotFoundError('Subscription not found');
        }

        sendSuccess(res, { subscription }, 'Subscription details retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/subscription/:subscriptionId/pause
 * Pause subscription
 */
export async function pauseSubscription(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { subscriptionId } = req.params;
        const { reason } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const subscription = await subscriptionService.pauseSubscription(
            subscriptionId,
            reason || 'User requested pause',
            req.user.id,
            ipAddress
        );

        sendSuccess(res, { subscription }, 'Subscription paused');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/subscription/:subscriptionId/resume
 * Resume subscription
 */
export async function resumeSubscription(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { subscriptionId } = req.params;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const subscription = await subscriptionService.resumeSubscription(
            subscriptionId,
            req.user.id,
            ipAddress
        );

        sendSuccess(res, { subscription }, 'Subscription resumed');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/subscription/:subscriptionId/cancel
 * Cancel subscription
 */
export async function cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { subscriptionId } = req.params;
        const { reason } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const subscription = await subscriptionService.cancelSubscription(
            subscriptionId,
            reason || 'User requested cancellation',
            req.user.id,
            ipAddress
        );

        sendSuccess(res, { subscription }, 'Subscription cancelled');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/subscription/:subscriptionId/plan
 * Change subscription plan
 */
export async function changePlan(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { subscriptionId } = req.params;
        const { planType } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const subscription = await subscriptionService.changePlan(
            subscriptionId,
            planType,
            req.user.id,
            ipAddress
        );

        sendSuccess(res, { subscription }, 'Subscription plan changed');
    } catch (error) {
        next(error);
    }
}
