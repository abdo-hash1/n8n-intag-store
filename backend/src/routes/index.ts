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

// Admin routes
router.use('/admin', adminRoutes);

export default router;
