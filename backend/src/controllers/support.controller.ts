/**
 * Support Controller
 * Handles HTTP requests for support ticket endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { supportService } from '../services/index.js';
import { sendSuccess, sendCreated, NotFoundError, BadRequestError } from '../utils/index.js';

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
export async function createTicket(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { subject, description, category, priority } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const ticket = await supportService.createTicket(
            {
                userId: req.user.id,
                subject,
                description,
                category: category || 'other',
                priority: priority || 'normal',
            },
            ipAddress
        );

        sendCreated(res, { ticket }, 'Support ticket created');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/support/tickets
 * Get user's tickets
 */
export async function getMyTickets(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { page, limit, status } = req.query;

        const result = await supportService.getUserTickets(req.user.id, {
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 20,
            status: status as string,
        });

        sendSuccess(res, result, 'Tickets retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/support/tickets/:ticketId
 * Get ticket details
 */
export async function getTicketDetails(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { ticketId } = req.params;
        const isAdmin = ['admin', 'super_admin', 'support_agent'].includes(req.user.role);

        const ticket = await supportService.getTicketById(ticketId, req.user.id, isAdmin);

        sendSuccess(res, { ticket }, 'Ticket details retrieved');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/support/tickets/:ticketId/messages
 * Add message to ticket
 */
export async function addMessage(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { ticketId } = req.params;
        const { content } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;
        const isFromAdmin = ['admin', 'super_admin', 'support_agent'].includes(req.user.role);

        if (!content || content.trim().length === 0) {
            throw new BadRequestError('Message content is required');
        }

        const message = await supportService.addMessage(
            {
                ticketId,
                userId: req.user.id,
                content: content.trim(),
                isFromAdmin,
            },
            ipAddress
        );

        sendCreated(res, { message }, 'Message added');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/support/tickets/:ticketId/status
 * Update ticket status
 */
export async function updateTicketStatus(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { ticketId } = req.params;
        const { status } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;
        const isAdmin = ['admin', 'super_admin', 'support_agent'].includes(req.user.role);

        if (!['open', 'waiting_customer', 'waiting_admin', 'resolved', 'closed'].includes(status)) {
            throw new BadRequestError('Invalid status');
        }

        const ticket = await supportService.updateTicketStatus(
            ticketId,
            status,
            req.user.id,
            isAdmin,
            ipAddress
        );

        sendSuccess(res, { ticket }, 'Ticket status updated');
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/support/tickets/:ticketId/assign
 * Assign ticket to admin (admin only)
 */
export async function assignTicket(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            throw new NotFoundError('User not found');
        }

        const { ticketId } = req.params;
        const { adminId } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const ticket = await supportService.assignTicket(
            ticketId,
            adminId,
            req.user.id,
            ipAddress
        );

        sendSuccess(res, { ticket }, 'Ticket assigned');
    } catch (error) {
        next(error);
    }
}
