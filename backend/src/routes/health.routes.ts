/**
 * Health Check Routes
 * /api/health/*
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

/**
 * @route   GET /api/health/db
 * @desc    Database connection health check
 * @access  Public
 */
router.get('/db', async (req: Request, res: Response) => {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            success: true,
            message: 'Database connection is healthy',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Database connection failed',
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check (for monitoring)
 * @access  Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
    const checks: {
        name: string;
        status: 'healthy' | 'unhealthy';
        latency?: number;
        error?: string;
    }[] = [];

    // Check database
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        checks.push({
            name: 'database',
            status: 'healthy',
            latency: Date.now() - dbStart,
        });
    } catch (error) {
        checks.push({
            name: 'database',
            status: 'unhealthy',
            error: (error as Error).message,
        });
    }

    const allHealthy = checks.every((c) => c.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        message: allHealthy ? 'All systems healthy' : 'Some systems are unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        checks,
    });
});

export default router;
