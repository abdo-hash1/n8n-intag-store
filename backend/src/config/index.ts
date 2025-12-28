/**
 * Application Configuration
 * Centralizes all environment variables and configuration settings
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export const config = {
    // Node Environment
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',

    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '3001', 10),
        apiPrefix: process.env.API_PREFIX || '/api',
    },

    // Database
    database: {
        url: process.env.DATABASE_URL as string,
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET as string,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET as string,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // CORS Configuration
    cors: {
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    },

    // Security
    security: {
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    // Pricing Configuration (in EGP)
    pricing: {
        monthly: parseInt(process.env.MONTHLY_PRICE || '400', 10),
        annual: parseInt(process.env.ANNUAL_PRICE || '3800', 10),
        currency: process.env.CURRENCY || 'EGP',
    },

    // Business Rules
    business: {
        refundPeriodDays: parseInt(process.env.REFUND_PERIOD_DAYS || '7', 10),
        gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS || '7', 10),
        dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '30', 10),
    },

    // Payment Gateway - Paymob
    paymob: {
        apiKey: process.env.PAYMOB_API_KEY || '',
        integrationId: process.env.PAYMOB_INTEGRATION_ID || '',
        iframeId: process.env.PAYMOB_IFRAME_ID || '',
        hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
        baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api',
    },

    // Email - SendGrid
    email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
        fromName: process.env.SENDGRID_FROM_NAME || 'n8n SaaS Platform',
    },

    // n8n Docker Configuration
    n8n: {
        basePort: parseInt(process.env.N8N_BASE_PORT || '5000', 10),
        domain: process.env.N8N_DOMAIN || 'n8n.localhost',
        encryptionKey: process.env.N8N_ENCRYPTION_KEY || '',
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'debug',
        format: process.env.LOG_FORMAT || 'combined',
    },
} as const;

export type Config = typeof config;
