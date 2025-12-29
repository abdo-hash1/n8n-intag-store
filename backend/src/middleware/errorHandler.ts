/**
 * Error Handler Middleware
 * Global error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';
import { AppError, ValidationError, ValidationErrorDetail, sendError } from '../utils/index.js';

/**
 * Handle 404 - Route not found
 */
export function notFoundHandler(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const error = new AppError(
        `Route ${req.method} ${req.originalUrl} not found`,
        404,
        'ROUTE_NOT_FOUND'
    );
    next(error);
}

/**
 * Global error handler
 * Catches all errors and sends appropriate response
 */
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): Response {
    // Log the error
    logger.error('Error caught by global handler:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
    });

    // Handle known application errors
    if (error instanceof AppError) {
        const response: {
            success: boolean;
            message: string;
            code: string;
            errors?: ValidationErrorDetail[];
        } = {
            success: false,
            message: error.message,
            code: error.code,
        };

        // Add validation errors if present (check both instanceof and property existence)
        if (error instanceof ValidationError && error.errors && error.errors.length > 0) {
            response.errors = error.errors;
        } else if ('errors' in error && Array.isArray((error as { errors?: unknown[] }).errors)) {
            // Fallback for cases where instanceof might fail due to module resolution
            response.errors = (error as { errors: ValidationErrorDetail[] }).errors;
        }

        return res.status(error.statusCode).json(response);
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(error, res);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return sendError(
            res,
            'Invalid data provided',
            400
        );
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return sendError(res, 'Invalid token', 401);
    }

    if (error.name === 'TokenExpiredError') {
        return sendError(res, 'Token has expired', 401);
    }

    // Handle syntax errors (invalid JSON)
    if (error instanceof SyntaxError && 'body' in error) {
        return sendError(res, 'Invalid JSON in request body', 400);
    }

    // Unknown errors - don't expose details in production
    const message = config.isProduction
        ? 'An unexpected error occurred'
        : error.message;

    return sendError(res, message, 500);
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    res: Response
): Response {
    switch (error.code) {
        case 'P2002': {
            // Unique constraint violation
            const target = (error.meta?.target as string[]) || ['field'];
            const field = target[0];
            return sendError(
                res,
                `${formatFieldName(field)} already exists`,
                409
            );
        }

        case 'P2014':
            // Required relation violation
            return sendError(
                res,
                'Invalid relationship data',
                400
            );

        case 'P2003':
            // Foreign key constraint failed
            return sendError(
                res,
                'Related record not found',
                400
            );

        case 'P2025':
            // Record not found
            return sendError(
                res,
                'Record not found',
                404
            );

        default:
            logger.error('Unhandled Prisma error:', { code: error.code, meta: error.meta });
            return sendError(
                res,
                'Database operation failed',
                500
            );
    }
}

/**
 * Format field name for user-friendly error messages
 */
function formatFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
        email: 'Email',
        phone: 'Phone number',
        username: 'Username',
    };
    return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
}
