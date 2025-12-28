/**
 * Authentication Middleware
 * JWT token verification and user injection
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import {
    UnauthorizedError,
    ForbiddenError,
    verifyAccessToken,
    extractTokenFromHeader,
    type DecodedToken
} from '../utils/index.js';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                fullName: string;
            };
            token?: string;
        }
    }
}

/**
 * Authenticate user via JWT token
 * Required for protected routes
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Extract token from Authorization header
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            throw new UnauthorizedError('Access token is required');
        }

        // Verify the token
        let decoded: DecodedToken;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            if ((error as Error).name === 'TokenExpiredError') {
                throw new UnauthorizedError('Access token has expired');
            }
            throw new UnauthorizedError('Invalid access token');
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                status: true,
            },
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        if (user.status !== 'active') {
            throw new ForbiddenError('Account is not active');
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
        };
        req.token = token;

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if not
 */
export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return next();
        }

        try {
            const decoded = verifyAccessToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    status: true,
                },
            });

            if (user && user.status === 'active') {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    fullName: user.fullName,
                };
                req.token = token;
            }
        } catch {
            // Token invalid, continue without user
            logger.debug('Optional auth: Invalid token provided');
        }

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Require specific roles
 * Must be used after authenticate middleware
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(new UnauthorizedError('Authentication required'));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            next(new ForbiddenError('You do not have permission to access this resource'));
            return;
        }

        next();
    };
}

/**
 * Require admin access
 * Shorthand for requireRole('admin', 'super_admin')
 */
export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    return requireRole('admin', 'super_admin')(req, res, next);
}

/**
 * Require super admin access
 */
export function requireSuperAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    return requireRole('super_admin')(req, res, next);
}
