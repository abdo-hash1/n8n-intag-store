/**
 * Payment Routes
 * /api/payments/*
 * Handles payment processing and webhooks
 */

import { Router } from 'express';
import { paymentController } from '../controllers/index.js';
import { authenticate, paymentRateLimiter } from '../middleware/index.js';

const router = Router();

/**
 * @route   POST /api/payments/create-intent
 * @desc    Create a payment intent for subscription
 * @access  Private
 */
router.post('/create-intent', paymentRateLimiter, authenticate, paymentController.createPaymentIntent);

/**
 * @route   POST /api/payments/webhook/paymob
 * @desc    Paymob webhook callback
 * @access  Public (verified by HMAC)
 */
router.post('/webhook/paymob', paymentController.handlePaymobWebhook);

/**
 * @route   POST /api/payments/mock/complete
 * @desc    Complete mock payment (development only)
 * @access  Private
 */
router.post('/mock/complete', authenticate, paymentController.completeMockPayment);

/**
 * @route   GET /api/payments/status/:paymentId
 * @desc    Get payment status
 * @access  Private
 */
router.get('/status/:paymentId', authenticate, paymentController.getPaymentStatus);

export default router;
