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

// All user routes require authentication
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

export default router;
