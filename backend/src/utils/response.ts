/**
 * API Response Utilities
 * Standardized response format for all API endpoints
 */

import { Response } from 'express';

// Standard API response structure
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string>[];
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

/**
 * Send a success response
 */
export function sendSuccess<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
): Response {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
}

/**
 * Send a paginated success response
 */
export function sendPaginatedSuccess<T>(
    res: Response,
    data: T[],
    meta: { page: number; limit: number; total: number },
    message: string = 'Success'
): Response {
    const response: ApiResponse<T[]> = {
        success: true,
        message,
        data,
        meta: {
            page: meta.page,
            limit: meta.limit,
            total: meta.total,
            totalPages: Math.ceil(meta.total / meta.limit),
        },
    };
    return res.status(200).json(response);
}

/**
 * Send an error response
 */
export function sendError(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: Record<string, string>[]
): Response {
    const response: ApiResponse = {
        success: false,
        message,
        errors,
    };
    return res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
): Response {
    return sendSuccess(res, data, message, 201);
}

/**
 * Send a no content response (204)
 */
export function sendNoContent(res: Response): Response {
    return res.status(204).send();
}
