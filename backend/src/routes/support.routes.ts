/**
 * Support Routes
 * /api/support/*
 */

import { Router } from 'express';
import { supportController } from '../controllers/index.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

// All support routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/support/tickets
 * @desc    Create a new support ticket
 * @access  Protected
 */
router.post('/tickets', supportController.createTicket);

/**
 * @route   GET /api/support/tickets
 * @desc    Get user's tickets
 * @access  Protected
 */
router.get('/tickets', supportController.getMyTickets);

/**
 * @route   GET /api/support/tickets/:ticketId
 * @desc    Get ticket details
 * @access  Protected
 */
router.get('/tickets/:ticketId', supportController.getTicketDetails);

/**
 * @route   POST /api/support/tickets/:ticketId/messages
 * @desc    Add message to ticket
 * @access  Protected
 */
router.post('/tickets/:ticketId/messages', supportController.addMessage);

/**
 * @route   PUT /api/support/tickets/:ticketId/status
 * @desc    Update ticket status
 * @access  Protected
 */
router.put('/tickets/:ticketId/status', supportController.updateTicketStatus);

/**
 * @route   PUT /api/support/tickets/:ticketId/assign
 * @desc    Assign ticket to admin
 * @access  Admin
 */
router.put('/tickets/:ticketId/assign', requireAdmin, supportController.assignTicket);

export default router;
