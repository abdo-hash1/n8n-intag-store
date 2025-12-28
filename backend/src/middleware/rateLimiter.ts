/**
 * Rate Limiting Middleware
 * Prevent abuse and brute force attacks
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { RateLimitError } from '../utils/index.js';

/**
 * Default rate limiter
 * 1000 requests per 15 minutes (increased for development)
 */
export const defaultRateLimiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.isDevelopment ? 1000 : config.security.rateLimitMaxRequests,
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        });
    },
});

/**
 * Admin rate limiter - more lenient
 * 500 requests per 5 minutes for admin panel
 */
export const adminRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: config.isDevelopment ? 2000 : 500,
    message: {
        success: false,
        message: 'Too many admin requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.isDevelopment, // Skip rate limiting in development
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many admin requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        });
    },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts, please try again in 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use IP + email for more precise limiting
        const email = req.body?.email || '';
        return `${req.ip}-${email}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many login attempts, please try again in 15 minutes',
            code: 'RATE_LIMIT_EXCEEDED',
        });
    },
});

/**
 * Rate limiter for signup
 * 3 signups per hour per IP
 */
export const signupRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        message: 'Too many signup attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many signup attempts, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        });
    },
});

/**
 * Rate limiter for password reset
 * 3 requests per hour
 */
export const passwordResetRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        message: 'Too many password reset requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many password reset requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        });
    },
});

/**
 * Rate limiter for payment operations
 * 10 requests per minute
 */
export const paymentRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: {
        success: false,
        message: 'Too many payment requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many payment requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        });
    },
});
