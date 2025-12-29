/**
 * Instance Routes (n8n Docker Containers)
 * /api/instance/*
 * Manages user's n8n instances
 */

import { Router } from 'express';
import { instanceController } from '../controllers/index.js';
import { authenticate, requireAdmin, defaultRateLimiter } from '../middleware/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/instance/provision
 * @desc    Provision a new n8n instance for the user
 * @access  Private
 */
router.post('/provision', defaultRateLimiter, instanceController.provisionInstance);

/**
 * @route   GET /api/instance/status
 * @desc    Get current user's instance status
 * @access  Private
 */
router.get('/status', instanceController.getInstanceStatus);

/**
 * @route   POST /api/instance/start
 * @desc    Start the user's n8n instance
 * @access  Private
 */
router.post('/start', instanceController.startInstance);

/**
 * @route   POST /api/instance/stop
 * @desc    Stop the user's n8n instance
 * @access  Private
 */
router.post('/stop', instanceController.stopInstance);

/**
 * @route   POST /api/instance/restart
 * @desc    Restart the user's n8n instance
 * @access  Private
 */
router.post('/restart', instanceController.restartInstance);

/**
 * @route   GET /api/instance/logs
 * @desc    Get instance logs
 * @access  Private
 */
router.get('/logs', instanceController.getInstanceLogs);

// Admin routes
/**
 * @route   POST /api/instance/admin/:userId/provision
 * @desc    Admin provision an instance for a user
 * @access  Admin
 */
router.post('/admin/:userId/provision', requireAdmin, instanceController.adminProvisionInstance);

/**
 * @route   DELETE /api/instance/admin/:userId
 * @desc    Admin destroy a user's instance
 * @access  Admin
 */
router.delete('/admin/:userId', requireAdmin, instanceController.adminDestroyInstance);

/**
 * @route   GET /api/instance/admin/:userId/status
 * @desc    Admin get a user's instance status
 * @access  Admin
 */
router.get('/admin/:userId/status', requireAdmin, instanceController.adminGetInstanceStatus);

export default router;
