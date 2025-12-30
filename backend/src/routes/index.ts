/**
 * Routes Index
 * Combine all routes
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import healthRoutes from './health.routes.js';
import adminRoutes from './admin.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import supportRoutes from './support.routes.js';
import paymentRoutes from './payment.routes.js';
import instanceRoutes from './instance.routes.js';
import couponRoutes from './coupon.routes.js';
import pricingRoutes from './pricing.routes.js';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/user', userRoutes);

// Subscription routes
router.use('/subscription', subscriptionRoutes);

// Support routes
router.use('/support', supportRoutes);

// Payment routes
router.use('/payments', paymentRoutes);

// Instance routes (n8n Docker containers)
router.use('/instance', instanceRoutes);

// Coupon routes
router.use('/coupons', couponRoutes);

// Pricing routes
router.use('/pricing', pricingRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;

