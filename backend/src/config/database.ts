/**
 * Prisma Database Client
 * Singleton pattern to prevent multiple connections
 */

import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    });

if (!config.isProduction) {
    globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
