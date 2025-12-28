/**
 * Subscription Routes
 * /api/subscription/*
 */

import { Router } from 'express';
import { subscriptionController } from '../controllers/index.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

// All subscription routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/subscription
 * @desc    Create a new subscription
 * @access  Protected
 */
router.post('/', subscriptionController.createSubscription);

/**
 * @route   GET /api/subscription
 * @desc    Get user's active subscription
 * @access  Protected
 */
router.get('/', subscriptionController.getMySubscription);

/**
 * @route   GET /api/subscription/:subscriptionId
 * @desc    Get subscription details
 * @access  Protected
 */
router.get('/:subscriptionId', subscriptionController.getSubscriptionDetails);

/**
 * @route   POST /api/subscription/:subscriptionId/pause
 * @desc    Pause subscription
 * @access  Protected
 */
router.post('/:subscriptionId/pause', subscriptionController.pauseSubscription);

/**
 * @route   POST /api/subscription/:subscriptionId/resume
 * @desc    Resume subscription
 * @access  Protected
 */
router.post('/:subscriptionId/resume', subscriptionController.resumeSubscription);

/**
 * @route   POST /api/subscription/:subscriptionId/cancel
 * @desc    Cancel subscription
 * @access  Protected
 */
router.post('/:subscriptionId/cancel', subscriptionController.cancelSubscription);

/**
 * @route   PUT /api/subscription/:subscriptionId/plan
 * @desc    Change subscription plan
 * @access  Protected
 */
router.put('/:subscriptionId/plan', subscriptionController.changePlan);

export default router;
