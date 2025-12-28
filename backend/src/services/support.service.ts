/**
 * Support Service
 * Business logic for support ticket system
 */

import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/index.js';
import { activityLogService } from './activityLog.service.js';

interface CreateTicketData {
    userId: string;
    subject: string;
    description: string;
    category: 'billing' | 'technical' | 'refund' | 'other';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface AddMessageData {
    ticketId: string;
    userId: string;
    content: string;
    isFromAdmin: boolean;
}

class SupportService {
    /**
     * Create a new support ticket
     */
    async createTicket(data: CreateTicketData, ipAddress?: string) {
        const ticket = await prisma.supportTicket.create({
            data: {
                userId: data.userId,
                subject: data.subject,
                description: data.description,
                category: data.category,
                priority: data.priority || 'normal',
                status: 'open',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });

        // Log activity
        await activityLogService.log({
            userId: data.userId,
            action: 'support_ticket_created',
            details: { ticketId: ticket.id, subject: data.subject, category: data.category },
            ipAddress,
        });

        logger.info(`Support ticket created: ${ticket.id} by user ${data.userId}`);

        return ticket;
    }

    /**
     * Get ticket by ID
     */
    async getTicketById(ticketId: string, userId?: string, isAdmin: boolean = false) {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
                assignedAdmin: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }

        // Check access permission
        if (!isAdmin && userId && ticket.userId !== userId) {
            throw new ForbiddenError('You do not have access to this ticket');
        }

        return ticket;
    }

    /**
     * Get user's tickets
     */
    async getUserTickets(userId: string, options: {
        page?: number;
        limit?: number;
        status?: string;
    } = {}) {
        const { page = 1, limit = 20, status } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { userId };
        if (status) where.status = status;

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                include: {
                    _count: {
                        select: { messages: true },
                    },
                },
            }),
            prisma.supportTicket.count({ where }),
        ]);

        return { tickets, total, page, limit };
    }

    /**
     * Add message to ticket
     */
    async addMessage(data: AddMessageData, ipAddress?: string) {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: data.ticketId },
        });

        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }

        // Check if user can add message (owner or admin)
        if (!data.isFromAdmin && ticket.userId !== data.userId) {
            throw new ForbiddenError('You cannot add messages to this ticket');
        }

        // Create message
        const message = await prisma.supportMessage.create({
            data: {
                ticketId: data.ticketId,
                userId: data.userId,
                content: data.content,
                isFromAdmin: data.isFromAdmin,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
        });

        // Update ticket status
        const newStatus = data.isFromAdmin ? 'waiting_customer' : 'waiting_admin';
        await prisma.supportTicket.update({
            where: { id: data.ticketId },
            data: {
                status: newStatus,
                // Set first response time if this is first admin response
                firstResponseAt: data.isFromAdmin && !ticket.firstResponseAt
                    ? new Date()
                    : ticket.firstResponseAt,
            },
        });

        logger.info(`Message added to ticket ${data.ticketId} by user ${data.userId}`);

        return message;
    }

    /**
     * Update ticket status
     */
    async updateTicketStatus(
        ticketId: string,
        status: 'open' | 'waiting_customer' | 'waiting_admin' | 'resolved' | 'closed',
        userId: string,
        isAdmin: boolean,
        ipAddress?: string
    ) {
        const ticket = await this.getTicketById(ticketId, userId, isAdmin);

        // Users can only close their own tickets
        if (!isAdmin && !['resolved', 'closed'].includes(status)) {
            throw new BadRequestError('You can only close your ticket');
        }

        const updateData: Record<string, unknown> = { status };

        if (status === 'resolved') {
            updateData.resolvedAt = new Date();
        } else if (status === 'closed') {
            updateData.closedAt = new Date();
        }

        const updated = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: updateData,
        });

        // Log activity
        await activityLogService.log({
            userId,
            action: 'ticket_status_changed',
            details: { ticketId, oldStatus: ticket.status, newStatus: status },
            ipAddress,
        });

        return updated;
    }

    /**
     * Assign ticket to admin
     */
    async assignTicket(
        ticketId: string,
        adminId: string,
        assignedByAdminId: string,
        ipAddress?: string
    ) {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            throw new NotFoundError('Ticket not found');
        }

        const updated = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { assignedAdminId: adminId },
            include: {
                assignedAdmin: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
        });

        // Log activity
        await activityLogService.log({
            userId: assignedByAdminId,
            action: 'ticket_assigned',
            details: { ticketId, assignedTo: adminId },
            ipAddress,
        });

        return updated;
    }

    /**
     * Get all tickets (admin)
     */
    async getAllTickets(options: {
        page?: number;
        limit?: number;
        status?: string;
        category?: string;
        priority?: string;
        assignedTo?: string;
    } = {}) {
        const { page = 1, limit = 20, status, category, priority, assignedTo } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (category) where.category = category;
        if (priority) where.priority = priority;
        if (assignedTo) where.assignedAdminId = assignedTo;

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                        },
                    },
                    assignedAdmin: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    _count: {
                        select: { messages: true },
                    },
                },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' },
                ],
                take: limit,
                skip,
            }),
            prisma.supportTicket.count({ where }),
        ]);

        return { tickets, total, page, limit };
    }

    /**
     * Get ticket statistics (admin)
     */
    async getTicketStats() {
        const [
            total,
            open,
            waitingCustomer,
            waitingAdmin,
            resolved,
            closed,
            urgent,
            high,
        ] = await Promise.all([
            prisma.supportTicket.count(),
            prisma.supportTicket.count({ where: { status: 'open' } }),
            prisma.supportTicket.count({ where: { status: 'waiting_customer' } }),
            prisma.supportTicket.count({ where: { status: 'waiting_admin' } }),
            prisma.supportTicket.count({ where: { status: 'resolved' } }),
            prisma.supportTicket.count({ where: { status: 'closed' } }),
            prisma.supportTicket.count({ where: { priority: 'urgent', status: { not: 'closed' } } }),
            prisma.supportTicket.count({ where: { priority: 'high', status: { not: 'closed' } } }),
        ]);

        return {
            total,
            byStatus: { open, waitingCustomer, waitingAdmin, resolved, closed },
            byPriority: { urgent, high },
            needsAttention: open + waitingAdmin + urgent,
        };
    }
}

export const supportService = new SupportService();
