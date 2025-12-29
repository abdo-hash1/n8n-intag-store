/**
 * Paymob Payment Gateway Service
 * Integration with Paymob Accept API for payment processing in Egypt
 */

import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { activityLogService } from './activityLog.service.js';
import { emailService } from './email.service.js';
import { BadRequestError, NotFoundError } from '../utils/index.js';
import crypto from 'crypto';

interface PaymobConfig {
    apiKey: string;
    integrationId: string;
    iframeId: string;
    hmacSecret: string;
    baseUrl: string;
}

interface PaymentIntentData {
    userId: string;
    subscriptionId: string;
    amount: number;
    planType: 'monthly' | 'yearly';
    billingData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
}

interface PaymobWebhookData {
    obj: {
        id: number;
        pending: boolean;
        amount_cents: number;
        success: boolean;
        is_refunded: boolean;
        created_at: string;
        currency: string;
        error_occured: boolean;
        order: {
            id: number;
        };
        source_data: {
            type: string;
            sub_type: string;
        };
        data: {
            txn_response_code?: string;
            message?: string;
        };
    };
    type: string;
    hmac: string;
}

class PaymobService {
    private config: PaymobConfig;
    private isConfigured: boolean = false;

    constructor() {
        this.config = {
            apiKey: process.env.PAYMOB_API_KEY || '',
            integrationId: process.env.PAYMOB_INTEGRATION_ID || '',
            iframeId: process.env.PAYMOB_IFRAME_ID || '',
            hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
            baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api',
        };

        this.isConfigured = !!(
            this.config.apiKey &&
            this.config.integrationId &&
            this.config.iframeId
        );

        if (!this.isConfigured) {
            logger.warn('Paymob is not fully configured. Payment processing will use mock mode.');
        }
    }

    /**
     * Step 1: Get authentication token from Paymob
     */
    private async getAuthToken(): Promise<string> {
        const response = await fetch(`${this.config.baseUrl}/auth/tokens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: this.config.apiKey }),
        });

        if (!response.ok) {
            throw new BadRequestError('Failed to authenticate with Paymob');
        }

        const data = await response.json() as { token: string };
        return data.token;
    }

    /**
     * Step 2: Register order with Paymob
     */
    private async registerOrder(
        authToken: string,
        amountCents: number,
        merchantOrderId: string
    ): Promise<number> {
        const response = await fetch(`${this.config.baseUrl}/ecommerce/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auth_token: authToken,
                delivery_needed: false,
                amount_cents: amountCents,
                currency: 'EGP',
                merchant_order_id: merchantOrderId,
                items: [],
            }),
        });

        if (!response.ok) {
            throw new BadRequestError('Failed to register order with Paymob');
        }

        const data = await response.json() as { id: number };
        return data.id;
    }

    /**
     * Step 3: Get payment key for iframe
     */
    private async getPaymentKey(
        authToken: string,
        orderId: number,
        amountCents: number,
        billingData: PaymentIntentData['billingData']
    ): Promise<string> {
        const response = await fetch(`${this.config.baseUrl}/acceptance/payment_keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auth_token: authToken,
                amount_cents: amountCents,
                expiration: 3600, // 1 hour
                order_id: orderId,
                billing_data: {
                    first_name: billingData.firstName,
                    last_name: billingData.lastName,
                    email: billingData.email,
                    phone_number: billingData.phone || '+201000000000',
                    apartment: 'NA',
                    floor: 'NA',
                    street: 'NA',
                    building: 'NA',
                    shipping_method: 'NA',
                    postal_code: 'NA',
                    city: 'Cairo',
                    country: 'EG',
                    state: 'Cairo',
                },
                currency: 'EGP',
                integration_id: parseInt(this.config.integrationId),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error('Paymob payment key error:', error);
            throw new BadRequestError('Failed to get payment key from Paymob');
        }

        const data = await response.json() as { token: string };
        return data.token;
    }

    /**
     * Create payment intent and get iframe URL
     */
    async createPaymentIntent(data: PaymentIntentData, ipAddress?: string): Promise<{
        paymentUrl: string;
        paymentId: string;
        orderId: number;
    }> {
        // If not configured, use mock payment
        if (!this.isConfigured) {
            return this.createMockPayment(data, ipAddress);
        }

        const amountCents = Math.round(data.amount * 100);
        const merchantOrderId = `${data.subscriptionId}-${Date.now()}`;

        try {
            // Step 1: Get auth token
            const authToken = await this.getAuthToken();

            // Step 2: Register order
            const orderId = await this.registerOrder(authToken, amountCents, merchantOrderId);

            // Step 3: Get payment key
            const paymentKey = await this.getPaymentKey(
                authToken,
                orderId,
                amountCents,
                data.billingData
            );

            // Create pending payment record
            const payment = await prisma.payment.create({
                data: {
                    userId: data.userId,
                    subscriptionId: data.subscriptionId,
                    amount: data.amount,
                    currency: 'EGP',
                    status: 'pending',
                    paymentGateway: 'paymob',
                    gatewayTransactionId: orderId.toString(),
                },
            });

            // Log activity
            await activityLogService.log({
                userId: data.userId,
                subscriptionId: data.subscriptionId,
                action: 'payment_initiated',
                details: {
                    paymentId: payment.id,
                    amount: data.amount,
                    orderId,
                    planType: data.planType,
                },
                ipAddress,
            });

            // Build iframe URL
            const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}`;

            return {
                paymentUrl,
                paymentId: payment.id,
                orderId,
            };
        } catch (error) {
            logger.error('Paymob payment intent error:', error);
            throw new BadRequestError('Failed to create payment. Please try again.');
        }
    }

    /**
     * Mock payment for development/testing
     */
    private async createMockPayment(data: PaymentIntentData, ipAddress?: string): Promise<{
        paymentUrl: string;
        paymentId: string;
        orderId: number;
    }> {
        const mockOrderId = Date.now();

        // Create pending payment record
        const payment = await prisma.payment.create({
            data: {
                userId: data.userId,
                subscriptionId: data.subscriptionId,
                amount: data.amount,
                currency: 'EGP',
                status: 'pending',
                paymentGateway: 'mock',
                gatewayTransactionId: mockOrderId.toString(),
            },
        });

        // Log activity
        await activityLogService.log({
            userId: data.userId,
            subscriptionId: data.subscriptionId,
            action: 'payment_initiated',
            details: {
                paymentId: payment.id,
                amount: data.amount,
                mock: true,
            },
            ipAddress,
        });

        // Return mock payment URL (points to our checkout complete page)
        const paymentUrl = `${process.env.FRONTEND_URL}/checkout/complete?payment_id=${payment.id}&mock=true`;

        return {
            paymentUrl,
            paymentId: payment.id,
            orderId: mockOrderId,
        };
    }

    /**
     * Verify HMAC signature from Paymob webhook
     */
    verifyWebhookSignature(data: PaymobWebhookData, hmacHeader: string): boolean {
        if (!this.config.hmacSecret) {
            logger.warn('HMAC secret not configured, skipping verification');
            return true;
        }

        const obj = data.obj;
        const concatenated = [
            obj.amount_cents,
            obj.created_at,
            obj.currency,
            obj.error_occured,
            obj.order.id,
            obj.data.message || '',
            obj.data.txn_response_code || '',
            obj.id,
            obj.pending,
            obj.success,
        ].join('');

        const calculatedHmac = crypto
            .createHmac('sha512', this.config.hmacSecret)
            .update(concatenated)
            .digest('hex');

        return calculatedHmac === hmacHeader;
    }

    /**
     * Process Paymob webhook callback
     */
    async processWebhook(webhookData: PaymobWebhookData, ipAddress?: string): Promise<void> {
        const { obj } = webhookData;

        // Log the webhook
        await prisma.webhookLog.create({
            data: {
                gateway: 'paymob',
                eventType: webhookData.type,
                payload: JSON.stringify(webhookData),
                ipAddress,
            },
        });

        // Find the payment by gateway transaction ID
        const payment = await prisma.payment.findFirst({
            where: { gatewayTransactionId: obj.order.id.toString() },
            include: {
                user: true,
                subscription: true,
            },
        });

        if (!payment) {
            logger.warn(`Payment not found for Paymob order: ${obj.order.id}`);
            return;
        }

        // Update payment status based on webhook
        if (obj.success && !obj.pending && !obj.error_occured) {
            // Payment successful
            await this.handleSuccessfulPayment(payment, obj, ipAddress);
        } else if (obj.error_occured || (!obj.success && !obj.pending)) {
            // Payment failed
            await this.handleFailedPayment(payment, obj, ipAddress);
        }
        // If pending, we wait for the final status
    }

    /**
     * Handle successful payment
     */
    private async handleSuccessfulPayment(
        payment: any,
        paymobData: PaymobWebhookData['obj'],
        ipAddress?: string
    ): Promise<void> {
        // Update payment
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'success',
                gatewayTransactionId: paymobData.id.toString(),
            },
        });

        // Update subscription
        if (payment.subscription) {
            const periodEnd = new Date();
            if (payment.subscription.planType === 'yearly') {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            await prisma.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    status: 'active',
                    currentPeriodEnd: periodEnd,
                    nextBillingDate: periodEnd,
                },
            });
        }

        // Log activity
        await activityLogService.log({
            userId: payment.userId,
            subscriptionId: payment.subscriptionId,
            action: 'payment_success',
            details: {
                paymentId: payment.id,
                amount: payment.amount,
                transactionId: paymobData.id,
            },
            ipAddress,
        });

        // Send email notification
        if (payment.user) {
            await emailService.sendPaymentSuccess(
                payment.user.email,
                payment.user.fullName,
                payment.amount,
                paymobData.id.toString()
            );
        }

        logger.info(`Payment successful: ${payment.id}`);
    }

    /**
     * Handle failed payment
     */
    private async handleFailedPayment(
        payment: any,
        paymobData: PaymobWebhookData['obj'],
        ipAddress?: string
    ): Promise<void> {
        const failureReason = paymobData.data.message || 'Payment failed';

        // Update payment
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'failed',
                failureReason,
            },
        });

        // Update subscription status if needed
        if (payment.subscription) {
            await prisma.subscription.update({
                where: { id: payment.subscriptionId },
                data: { status: 'payment_failed' },
            });
        }

        // Log activity
        await activityLogService.log({
            userId: payment.userId,
            subscriptionId: payment.subscriptionId,
            action: 'payment_failed',
            details: {
                paymentId: payment.id,
                reason: failureReason,
            },
            ipAddress,
        });

        // Send email notification
        if (payment.user) {
            await emailService.sendPaymentFailed(
                payment.user.email,
                payment.user.fullName,
                failureReason
            );
        }

        logger.warn(`Payment failed: ${payment.id} - ${failureReason}`);
    }

    /**
     * Process a refund through Paymob
     */
    async processRefund(
        paymentId: string,
        amount: number,
        reason: string,
        adminId: string,
        ipAddress?: string
    ): Promise<any> {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { user: true },
        });

        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        if (payment.status !== 'success') {
            throw new BadRequestError('Only successful payments can be refunded');
        }

        if (payment.paymentGateway === 'mock') {
            // Mock refund
            const updatedPayment = await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'refunded',
                    refundedAt: new Date(),
                    refundAmount: amount,
                    refundReason: reason,
                },
            });

            await activityLogService.log({
                userId: adminId,
                action: 'payment_refunded',
                details: { paymentId, amount, reason, mock: true },
                ipAddress,
            });

            return updatedPayment;
        }

        // Real Paymob refund
        if (!this.isConfigured) {
            throw new BadRequestError('Paymob is not configured for refunds');
        }

        try {
            const authToken = await this.getAuthToken();

            const response = await fetch(`${this.config.baseUrl}/acceptance/void_refund/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth_token: authToken,
                    transaction_id: payment.gatewayTransactionId,
                    amount_cents: Math.round(amount * 100),
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                logger.error('Paymob refund error:', error);
                throw new BadRequestError('Failed to process refund through Paymob');
            }

            const refundData = await response.json() as { id: string | number };

            // Update payment record
            const updatedPayment = await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'refunded',
                    refundedAt: new Date(),
                    refundAmount: amount,
                    refundReason: reason,
                },
            });

            // Log activity
            await activityLogService.log({
                userId: adminId,
                action: 'payment_refunded',
                details: {
                    paymentId,
                    amount,
                    reason,
                    refundId: refundData.id,
                },
                ipAddress,
            });

            // Send email notification
            if (payment.user) {
                await emailService.queueEmail({
                    to: payment.user.email,
                    subject: 'تم معالجة طلب الاسترداد',
                    template: 'REFUND_PROCESSED',
                    data: {
                        fullName: payment.user.fullName,
                        amount,
                    },
                });
            }

            return updatedPayment;
        } catch (error) {
            logger.error('Refund processing error:', error);
            throw new BadRequestError('Failed to process refund');
        }
    }

    /**
     * Complete mock payment (for development)
     */
    async completeMockPayment(paymentId: string, success: boolean = true): Promise<any> {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                user: true,
                subscription: true,
            },
        });

        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        if (payment.paymentGateway !== 'mock') {
            throw new BadRequestError('This is not a mock payment');
        }

        if (success) {
            // Update payment
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'success',
                    gatewayTransactionId: `mock-${Date.now()}`,
                },
            });

            // Activate subscription
            if (payment.subscription) {
                const periodEnd = new Date();
                if (payment.subscription.planType === 'yearly') {
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                } else {
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                }

                await prisma.subscription.update({
                    where: { id: payment.subscriptionId },
                    data: {
                        status: 'active',
                        currentPeriodEnd: periodEnd,
                        nextBillingDate: periodEnd,
                    },
                });
            }

            // Log activity
            await activityLogService.log({
                userId: payment.userId,
                subscriptionId: payment.subscriptionId,
                action: 'payment_success',
                details: { paymentId, mock: true },
            });

            // Send email
            if (payment.user) {
                await emailService.sendPaymentSuccess(
                    payment.user.email,
                    payment.user.fullName,
                    payment.amount,
                    `mock-${paymentId.slice(0, 8)}`
                );
            }
        } else {
            // Mark as failed
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'failed',
                    failureReason: 'Mock payment rejected',
                },
            });

            // Log activity
            await activityLogService.log({
                userId: payment.userId,
                subscriptionId: payment.subscriptionId,
                action: 'payment_failed',
                details: { paymentId, mock: true, reason: 'Rejected' },
            });

            if (payment.user) {
                await emailService.sendPaymentFailed(
                    payment.user.email,
                    payment.user.fullName,
                    'Mock payment was rejected'
                );
            }
        }

        return prisma.payment.findUnique({
            where: { id: paymentId },
            include: { subscription: true },
        });
    }
}

export const paymobService = new PaymobService();
