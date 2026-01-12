/**
 * Instance Routes (n8n Docker Containers)
 * /api/instance/*
 * Manages user's n8n instances
 */

import { Router } from 'express';
import * as instanceController from '../controllers/instance.controller.js';
import { authenticate, requireAdmin, defaultRateLimiter } from '../middleware/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===================================
// User Routes
// ===================================

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
 * @route   POST /api/instance/resume
 * @desc    Resume a suspended n8n instance
 * @access  Private
 */
router.post('/resume', instanceController.resumeInstance);

// ===================================
// Admin Routes
// ===================================

/**
 * @route   GET /api/instance/admin/list
 * @desc    Get all n8n instances with pagination
 * @access  Admin
 */
router.get('/admin/list', requireAdmin, instanceController.adminGetAllInstances);

/**
 * @route   GET /api/instance/admin/stats
 * @desc    Get instance statistics
 * @access  Admin
 */
router.get('/admin/stats', requireAdmin, instanceController.adminGetInstanceStats);

/**
 * @route   GET /api/instance/admin/:userId
 * @desc    Get a user's instance details
 * @access  Admin
 */
router.get('/admin/:userId', requireAdmin, instanceController.adminGetInstanceStatus);

/**
 * @route   POST /api/instance/admin/:userId/provision
 * @desc    Admin provision an instance for a user
 * @access  Admin
 */
router.post('/admin/:userId/provision', requireAdmin, instanceController.adminProvisionInstance);

/**
 * @route   POST /api/instance/admin/:userId/suspend
 * @desc    Admin suspend a user's instance
 * @access  Admin
 */
router.post('/admin/:userId/suspend', requireAdmin, instanceController.adminSuspendInstance);

/**
 * @route   POST /api/instance/admin/:userId/resume
 * @desc    Admin resume a user's instance
 * @access  Admin
 */
router.post('/admin/:userId/resume', requireAdmin, instanceController.adminResumeInstance);

/**
 * @route   DELETE /api/instance/admin/:userId
 * @desc    Admin delete a user's instance
 * @access  Admin
 */
router.delete('/admin/:userId', requireAdmin, instanceController.adminDeleteInstance);

/**
 * @route   GET /api/instance/admin/:instanceId/logs
 * @desc    Get provisioning logs for an instance
 * @access  Admin
 */
router.get('/admin/:instanceId/logs', requireAdmin, instanceController.adminGetInstanceLogs);

export default router;
