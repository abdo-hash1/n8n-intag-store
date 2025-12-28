/**
 * n8n SaaS Platform - Backend Server
 * Main entry point for the Express application
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { prisma } from './config/database.js';
import { logger } from './config/logger.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler, defaultRateLimiter } from './middleware/index.js';

// Create Express app
const app: Express = express();

// ===========================================
// MIDDLEWARE SETUP
// ===========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin: config.cors.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Default rate limiting
app.use(config.server.apiPrefix, defaultRateLimiter);

// Request logging in development
if (config.isDevelopment) {
    app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`, {
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined,
        });
        next();
    });
}

// ===========================================
// ROUTES
// ===========================================

// API routes
app.use(config.server.apiPrefix, routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'n8n SaaS Platform API',
        version: '1.0.0',
        documentation: '/api/docs',
    });
});

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===========================================
// SERVER STARTUP
// ===========================================

async function startServer(): Promise<void> {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✓ Database connected successfully');

        // Start server
        app.listen(config.server.port, () => {
            logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 n8n SaaS Platform Backend                              ║
║                                                              ║
║   Server running on port ${config.server.port}                            ║
║   Environment: ${config.env.padEnd(42)}║
║                                                              ║
║   API Base URL: http://localhost:${config.server.port}${config.server.apiPrefix.padEnd(22)}║
║   Health Check: http://localhost:${config.server.port}${config.server.apiPrefix}/health       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

// Start the server
startServer();

export default app;
