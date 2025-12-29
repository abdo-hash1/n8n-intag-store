/**
 * User Controller
 * Handles HTTP requests for user endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/index.js';
import { sendSuccess, NotFoundError } from '../utils/index.js';

/**
 * GET /api/user/profile
 * Get user profile
 */
export async function getProfile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const profile = await userService.getProfile(req.user.id);

        sendSuccess(res, { user: profile }, 'Profile retrieved successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/user/profile
 * Update user profile
 */
export async function updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { fullName, phone } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const profile = await userService.updateProfile(
            req.user.id,
            { fullName, phone },
            ipAddress
        );

        sendSuccess(res, { user: profile }, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/user/password
 * Change user password
 */
export async function changePassword(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { currentPassword, newPassword } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        await userService.changePassword(
            req.user.id,
            currentPassword,
            newPassword,
            ipAddress
        );

        sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/user/preferences
 * Update email preferences
 */
export async function updatePreferences(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { emailNotifications, marketingEmails } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const preferences = await userService.updatePreferences(
            req.user.id,
            { emailNotifications, marketingEmails },
            ipAddress
        );

        sendSuccess(res, { preferences }, 'Preferences updated successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/user/subscription
 * Get user's active subscription
 */
export async function getSubscription(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const subscription = await userService.getActiveSubscription(req.user.id);

        sendSuccess(res, { subscription }, 'Subscription retrieved successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/user/activity
 * Get user's activity log
 */
export async function getActivityLog(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await userService.getActivityLog(req.user.id, page, limit);

        sendSuccess(res, result, 'Activity log retrieved successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/user/request-verification
 * Request email verification
 */
export async function requestEmailVerification(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const ipAddress = req.ip || req.socket.remoteAddress;

        await userService.requestEmailVerification(req.user.id, ipAddress);

        sendSuccess(res, null, 'Verification email sent. Please check your inbox.');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/user/verify-email
 * Verify email with token (public endpoint)
 */
export async function verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ success: false, message: 'Token is required' });
            return;
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const result = await userService.verifyEmail(token, ipAddress);

        if (result.success) {
            sendSuccess(res, { verified: true }, result.message);
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/user/email-status
 * Check if email is verified
 */
export async function getEmailStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const isVerified = await userService.isEmailVerified(req.user.id);

        sendSuccess(res, { emailVerified: isVerified }, 'Email status retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/user/payments
 * Get user's payment history
 */
export async function getPayments(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const payments = await userService.getPayments(req.user.id);

        sendSuccess(res, { payments }, 'Payments retrieved successfully');
    } catch (error) {
        next(error);
    }
}
