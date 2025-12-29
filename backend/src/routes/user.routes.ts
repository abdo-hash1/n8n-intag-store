/**
 * User Routes
 * /api/user/*
 */

import { Router } from 'express';
import { userController } from '../controllers/index.js';
import {
    authenticate,
    updateProfileValidation,
    changePasswordValidation,
    paginationValidation,
} from '../middleware/index.js';

const router = Router();

// Public route for email verification (no auth required)
/**
 * @route   GET /api/user/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.get('/verify-email', userController.verifyEmail);

// All other user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile
 * @access  Protected
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.put('/profile', updateProfileValidation, userController.updateProfile);

/**
 * @route   PUT /api/user/password
 * @desc    Change user password
 * @access  Protected
 */
router.put('/password', changePasswordValidation, userController.changePassword);

/**
 * @route   PUT /api/user/preferences
 * @desc    Update email preferences
 * @access  Protected
 */
router.put('/preferences', userController.updatePreferences);

/**
 * @route   GET /api/user/subscription
 * @desc    Get user's active subscription
 * @access  Protected
 */
router.get('/subscription', userController.getSubscription);

/**
 * @route   GET /api/user/activity
 * @desc    Get user's activity log
 * @access  Protected
 */
router.get('/activity', paginationValidation, userController.getActivityLog);

/**
 * @route   POST /api/user/request-verification
 * @desc    Request email verification
 * @access  Protected
 */
router.post('/request-verification', userController.requestEmailVerification);

/**
 * @route   GET /api/user/email-status
 * @desc    Check if email is verified
 * @access  Protected
 */
router.get('/email-status', userController.getEmailStatus);

/**
 * @route   GET /api/user/payments
 * @desc    Get user's payment history
 * @access  Protected
 */
router.get('/payments', userController.getPayments);

export default router;
