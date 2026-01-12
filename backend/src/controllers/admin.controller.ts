/**
 * Admin Controller
 * Handles HTTP requests for admin panel endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { adminService, subscriptionService, supportService } from '../services/index.js';
import { sendSuccess, sendPaginatedSuccess, BadRequestError } from '../utils/index.js';

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
export async function getDashboard(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const stats = await adminService.getDashboardStats();
        sendSuccess(res, stats, 'Dashboard statistics retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
export async function getUsers(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { page, limit, status, role, search } = req.query;

        const result = await adminService.getAllUsers({
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 20,
            status: status as string,
            role: role as string,
            search: search as string,
        });

        sendPaginatedSuccess(res, result.users, { page: result.page, limit: result.limit, total: result.total });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/users/:userId
 * Get user details
 */
export async function getUserDetails(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;
        const user = await adminService.getUserDetails(userId);
        sendSuccess(res, { user }, 'User details retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/users/:userId/status
 * Update user status
 */
export async function updateUserStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        if (!['active', 'suspended', 'deleted'].includes(status)) {
            throw new BadRequestError('Invalid status');
        }

        const user = await adminService.updateUserStatus(
            userId,
            status,
            req.user!.id,
            ipAddress
        );

        sendSuccess(res, { user }, 'User status updated');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/users/:userId/role
 * Update user role
 */
export async function updateUserRole(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        if (!['user', 'admin', 'support_agent'].includes(role)) {
            throw new BadRequestError('Invalid role');
        }

        const user = await adminService.updateUserRole(
            userId,
            role,
            req.user!.id,
            ipAddress
        );

        sendSuccess(res, { user }, 'User role updated');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/users
 * Create new admin/support user
 */
export async function createAdminUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password, fullName, role } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        if (!['admin', 'support_agent'].includes(role)) {
            throw new BadRequestError('Invalid role for admin creation');
        }

        const user = await adminService.createAdminUser(
            { email, password, fullName, role },
            req.user!.id,
            ipAddress
        );

        sendSuccess(res, { user }, 'Admin user created');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/subscriptions
 * Get all subscriptions
 */
export async function getSubscriptions(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { page, limit, status, planType, search } = req.query;

        const result = await subscriptionService.getAllSubscriptions({
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 20,
            status: status as string,
            planType: planType as string,
            search: search as string,
        });

        sendPaginatedSuccess(
            res,
            result.subscriptions,
            { page: result.page, limit: result.limit, total: result.total }
        );
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/subscriptions/stats
 * Get subscription statistics
 */
export async function getSubscriptionStats(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const stats = await subscriptionService.getStatistics();
        sendSuccess(res, stats, 'Subscription statistics retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/subscriptions/:subscriptionId
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
        sendSuccess(res, { subscription }, 'Subscription details retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/subscriptions/:subscriptionId
 * Update subscription (admin)
 */
export async function updateSubscription(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { subscriptionId } = req.params;
        const { status, planType, amount } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const subscription = await subscriptionService.adminUpdateSubscription(
            subscriptionId,
            { status, planType, amount },
            req.user!.id,
            ipAddress
        );

        sendSuccess(res, { subscription }, 'Subscription updated');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/payments
 * Get all payments
 */
export async function getPayments(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { page, limit, status } = req.query;

        const result = await adminService.getAllPayments({
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 20,
            status: status as string,
        });

        sendPaginatedSuccess(res, result.payments, { page: result.page, limit: result.limit, total: result.total });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/payments/:paymentId
 * Get payment details
 */
export async function getPaymentDetails(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { paymentId } = req.params;
        const payment = await adminService.getPaymentById(paymentId);
        sendSuccess(res, { payment }, 'Payment details retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/payments/:paymentId/refund
 * Refund a payment
 */
export async function refundPayment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { paymentId } = req.params;
        const { reason, amount } = req.body;
        const adminId = (req as any).user.id;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const payment = await adminService.refundPayment(paymentId, {
            reason,
            amount,
            adminId,
            ipAddress,
        });

        sendSuccess(res, { payment }, 'Payment refunded successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/tickets
 * Get all support tickets
 */
export async function getTickets(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { page, limit, status, category, priority } = req.query;

        const result = await supportService.getAllTickets({
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 20,
            status: status as string,
            category: category as string,
            priority: priority as string,
        });

        sendPaginatedSuccess(res, result.tickets, { page: result.page, limit: result.limit, total: result.total });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/tickets/stats
 * Get ticket statistics
 */
export async function getTicketStats(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const stats = await supportService.getTicketStats();
        sendSuccess(res, stats, 'Ticket statistics retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/activity
 * Get recent activity logs
 */
export async function getActivity(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
        const activity = await adminService.getRecentActivity(limit);
        sendSuccess(res, { activity }, 'Activity logs retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/admin/settings
 * Get system settings
 */
export async function getSettings(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const settings = await adminService.getSystemSettings();
        sendSuccess(res, { settings }, 'System settings retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/settings/:key
 * Update system setting
 */
export async function updateSetting(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const setting = await adminService.updateSystemSetting(
            key,
            value,
            req.user!.id,
            ipAddress
        );

        sendSuccess(res, { setting }, 'Setting updated');
    } catch (error) {
        next(error);
    }
}
