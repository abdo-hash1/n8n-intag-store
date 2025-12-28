/**
 * Admin Routes
 * /api/admin/*
 * All routes require admin role
 */

import { Router } from 'express';
import { adminController } from '../controllers/index.js';
import { authenticate, requireAdmin, adminRateLimiter } from '../middleware/index.js';

const router = Router();

// All admin routes: rate limiting, authentication, and admin role required
router.use(adminRateLimiter);
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination
 * @access  Admin
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user details
 * @access  Admin
 */
router.get('/users/:userId', adminController.getUserDetails);

/**
 * @route   PUT /api/admin/users/:userId/status
 * @desc    Update user status
 * @access  Admin
 */
router.put('/users/:userId/status', adminController.updateUserStatus);

/**
 * @route   PUT /api/admin/users/:userId/role
 * @desc    Update user role
 * @access  Admin
 */
router.put('/users/:userId/role', adminController.updateUserRole);

/**
 * @route   POST /api/admin/users
 * @desc    Create new admin/support user
 * @access  Super Admin
 */
router.post('/users', adminController.createAdminUser);

/**
 * @route   GET /api/admin/subscriptions
 * @desc    Get all subscriptions
 * @access  Admin
 */
router.get('/subscriptions', adminController.getSubscriptions);

/**
 * @route   GET /api/admin/subscriptions/stats
 * @desc    Get subscription statistics
 * @access  Admin
 */
router.get('/subscriptions/stats', adminController.getSubscriptionStats);

/**
 * @route   GET /api/admin/subscriptions/:subscriptionId
 * @desc    Get subscription details
 * @access  Admin
 */
router.get('/subscriptions/:subscriptionId', adminController.getSubscriptionDetails);

/**
 * @route   PUT /api/admin/subscriptions/:subscriptionId
 * @desc    Update subscription
 * @access  Admin
 */
router.put('/subscriptions/:subscriptionId', adminController.updateSubscription);

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments
 * @access  Admin
 */
router.get('/payments', adminController.getPayments);

/**
 * @route   GET /api/admin/payments/:paymentId
 * @desc    Get payment details
 * @access  Admin
 */
router.get('/payments/:paymentId', adminController.getPaymentDetails);

/**
 * @route   POST /api/admin/payments/:paymentId/refund
 * @desc    Refund a payment
 * @access  Admin
 */
router.post('/payments/:paymentId/refund', adminController.refundPayment);

/**
 * @route   GET /api/admin/tickets
 * @desc    Get all support tickets
 * @access  Admin
 */
router.get('/tickets', adminController.getTickets);

/**
 * @route   GET /api/admin/tickets/stats
 * @desc    Get ticket statistics
 * @access  Admin
 */
router.get('/tickets/stats', adminController.getTicketStats);

/**
 * @route   GET /api/admin/activity
 * @desc    Get recent activity logs
 * @access  Admin
 */
router.get('/activity', adminController.getActivity);

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings
 * @access  Admin
 */
router.get('/settings', adminController.getSettings);

/**
 * @route   PUT /api/admin/settings/:key
 * @desc    Update system setting
 * @access  Super Admin
 */
router.put('/settings/:key', adminController.updateSetting);

export default router;
