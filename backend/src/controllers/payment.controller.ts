/**
 * Payment Controller
 * Handles HTTP requests for payment endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { paymobService } from '../services/index.js';
import { sendSuccess, sendCreated, BadRequestError, NotFoundError } from '../utils/index.js';
import { prisma } from '../config/database.js';

/**
 * POST /api/payments/create-intent
 * Create a payment intent for subscription
 */
export async function createPaymentIntent(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        const { subscriptionId, planType } = req.body;

        if (!subscriptionId) {
            throw new BadRequestError('Subscription ID is required');
        }

        // Get subscription to verify ownership and get amount
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { user: true },
        });

        if (!subscription) {
            throw new NotFoundError('Subscription not found');
        }

        if (subscription.userId !== req.user.id) {
            throw new BadRequestError('You do not have access to this subscription');
        }

        const amount = subscription.amount || (planType === 'yearly' ? 3800 : 400);

        // Get user details for billing
        const user = subscription.user;
        const nameParts = user.fullName.split(' ');

        const ipAddress = req.ip || req.socket.remoteAddress;

        const result = await paymobService.createPaymentIntent({
            userId: req.user.id,
            subscriptionId,
            amount,
            planType: subscription.planType as 'monthly' | 'yearly',
            billingData: {
                firstName: nameParts[0] || user.fullName,
                lastName: nameParts.slice(1).join(' ') || user.fullName,
                email: user.email,
                phone: user.phone || '+201000000000',
            },
        }, ipAddress);

        sendCreated(res, {
            paymentUrl: result.paymentUrl,
            paymentId: result.paymentId,
        }, 'Payment intent created');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/payments/webhook/paymob
 * Handle Paymob webhook callback
 */
export async function handlePaymobWebhook(
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const hmacHeader = req.query.hmac as string || req.headers['x-paymob-hmac'] as string;
        const webhookData = req.body;

        // Verify HMAC signature
        if (hmacHeader && !paymobService.verifyWebhookSignature(webhookData, hmacHeader)) {
            throw new BadRequestError('Invalid webhook signature');
        }

        const ipAddress = req.ip || req.socket.remoteAddress;

        // Process the webhook
        await paymobService.processWebhook(webhookData, ipAddress);

        // Always respond 200 to acknowledge receipt
        res.status(200).json({ received: true });
    } catch (error) {
        // Log error but still respond 200 to prevent retries
        console.error('Webhook processing error:', error);
        res.status(200).json({ received: true, error: 'Processing failed' });
    }
}

/**
 * POST /api/payments/mock/complete
 * Complete a mock payment (development only)
 */
export async function completeMockPayment(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { paymentId, success = true } = req.body;

        if (!paymentId) {
            throw new BadRequestError('Payment ID is required');
        }

        const payment = await paymobService.completeMockPayment(paymentId, success);

        sendSuccess(res, { payment }, success ? 'Payment completed successfully' : 'Payment failed');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/payments/status/:paymentId
 * Get payment status
 */
export async function getPaymentStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new BadRequestError('User not authenticated');
        }

        const { paymentId } = req.params;

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                subscription: {
                    select: {
                        id: true,
                        planType: true,
                        status: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        // Verify ownership
        if (payment.userId !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
            throw new BadRequestError('You do not have access to this payment');
        }

        sendSuccess(res, { payment }, 'Payment status retrieved');
    } catch (error) {
        next(error);
    }
}
