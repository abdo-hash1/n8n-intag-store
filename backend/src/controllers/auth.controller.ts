/**
 * Authentication Controller
 * Handles HTTP requests for auth endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/index.js';
import { sendSuccess, sendCreated } from '../utils/index.js';

/**
 * POST /api/auth/signup
 * Register a new user
 */
export async function signup(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password, fullName, phone } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const result = await authService.signup(
            { email, password, fullName, phone },
            ipAddress
        );

        sendCreated(res, result, 'Account created successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/login
 * Login a user
 */
export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const result = await authService.login({ email, password }, ipAddress);

        sendSuccess(res, result, 'Login successful');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export async function refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { refreshToken } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress;

        const tokens = await authService.refreshToken(refreshToken, ipAddress);

        sendSuccess(res, { tokens }, 'Token refreshed successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/logout
 * Logout a user (optional - mainly for activity logging)
 */
export async function logout(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const ipAddress = req.ip || req.socket.remoteAddress;

        if (req.user) {
            await authService.logout(req.user.id, ipAddress);
        }

        sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/auth/me
 * Get current user info
 */
export async function getMe(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const user = await authService.getUserById(req.user.id);

        sendSuccess(res, { user }, 'User retrieved successfully');
    } catch (error) {
        next(error);
    }
}
