/**
 * JWT Token Utilities
 * Token generation and verification
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// Token payload interface
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

// Decoded token with standard JWT claims
export interface DecodedToken extends TokenPayload {
    iat: number;
    exp: number;
}

/**
 * Generate an access token
 */
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): DecodedToken {
    return jwt.verify(token, config.jwt.secret) as DecodedToken;
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken {
    return jwt.verify(token, config.jwt.refreshSecret) as DecodedToken;
}

/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>" format
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
} {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        expiresIn: config.jwt.expiresIn,
    };
}
