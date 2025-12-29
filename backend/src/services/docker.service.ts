/**
 * Docker Service
 * Manages n8n Docker container provisioning and lifecycle
 */

import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { activityLogService } from './activityLog.service.js';
import { NotFoundError, BadRequestError } from '../utils/index.js';
import crypto from 'crypto';

const execAsync = promisify(exec);

interface N8nContainerConfig {
    userId: string;
    encryptionKey?: string;
    webhookUrl?: string;
}

interface ContainerInfo {
    containerId: string;
    instanceUrl: string;
    port: number;
    status: 'running' | 'stopped' | 'error';
}

class DockerService {
    private readonly basePort: number;
    private readonly domain: string;
    private readonly networkName: string = 'n8n-saas-network';

    constructor() {
        this.basePort = parseInt(process.env.N8N_BASE_PORT || '5000');
        this.domain = process.env.N8N_DOMAIN || 'localhost';
    }

    /**
     * Generate a unique port for a new n8n instance
     */
    private async getNextAvailablePort(): Promise<number> {
        // Find the highest port currently in use
        const users = await prisma.user.findMany({
            where: { instanceUrl: { not: null } },
            select: { instanceUrl: true },
        });

        let maxPort = this.basePort;
        users.forEach(user => {
            if (user.instanceUrl) {
                const match = user.instanceUrl.match(/:(\d+)/);
                if (match) {
                    const port = parseInt(match[1]);
                    if (port > maxPort) maxPort = port;
                }
            }
        });

        return maxPort + 1;
    }

    /**
     * Generate a secure encryption key for n8n instance
     */
    private generateEncryptionKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Provision a new n8n instance for a user
     */
    async provisionInstance(config: N8nContainerConfig, ipAddress?: string): Promise<ContainerInfo> {
        const user = await prisma.user.findUnique({
            where: { id: config.userId },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.containerId) {
            throw new BadRequestError('User already has an n8n instance');
        }

        const port = await this.getNextAvailablePort();
        const encryptionKey = config.encryptionKey || this.generateEncryptionKey();
        const containerName = `n8n-user-${config.userId.slice(0, 8)}`;

        logger.info(`Provisioning n8n instance for user ${config.userId} on port ${port}`);

        try {
            // Create the Docker container
            const { stdout } = await execAsync(`
                docker run -d \
                    --name ${containerName} \
                    --network ${this.networkName} \
                    --restart unless-stopped \
                    -p ${port}:5678 \
                    -e N8N_BASIC_AUTH_ACTIVE=true \
                    -e N8N_BASIC_AUTH_USER=${user.email} \
                    -e N8N_ENCRYPTION_KEY=${encryptionKey} \
                    -e N8N_HOST=${this.domain} \
                    -e N8N_PORT=5678 \
                    -e N8N_PROTOCOL=https \
                    -e WEBHOOK_URL=https://${this.domain}:${port}/ \
                    -e GENERIC_TIMEZONE=Africa/Cairo \
                    -v n8n_data_${config.userId.slice(0, 8)}:/home/node/.n8n \
                    n8nio/n8n:latest
            `.trim().replace(/\s+/g, ' '));

            const containerId = stdout.trim().slice(0, 12);
            const instanceUrl = `https://${this.domain}:${port}`;

            // Update user with instance details
            await prisma.user.update({
                where: { id: config.userId },
                data: {
                    containerId,
                    instanceUrl,
                },
            });

            // Log activity
            await activityLogService.log({
                userId: config.userId,
                action: 'n8n_instance_provisioned',
                details: { containerId, instanceUrl, port },
                ipAddress,
            });

            logger.info(`n8n instance provisioned successfully: ${containerId}`);

            return {
                containerId,
                instanceUrl,
                port,
                status: 'running',
            };
        } catch (error) {
            logger.error('Failed to provision n8n instance:', error);
            throw new BadRequestError('Failed to provision n8n instance. Please try again later.');
        }
    }

    /**
     * Start a stopped n8n instance
     */
    async startInstance(userId: string, ipAddress?: string): Promise<ContainerInfo> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { containerId: true, instanceUrl: true },
        });

        if (!user?.containerId) {
            throw new NotFoundError('No n8n instance found for this user');
        }

        try {
            await execAsync(`docker start ${user.containerId}`);

            await activityLogService.log({
                userId,
                action: 'n8n_instance_started',
                details: { containerId: user.containerId },
                ipAddress,
            });

            const portMatch = user.instanceUrl?.match(/:(\d+)/);
            const port = portMatch ? parseInt(portMatch[1]) : 0;

            return {
                containerId: user.containerId,
                instanceUrl: user.instanceUrl || '',
                port,
                status: 'running',
            };
        } catch (error) {
            logger.error('Failed to start n8n instance:', error);
            throw new BadRequestError('Failed to start n8n instance');
        }
    }

    /**
     * Stop a running n8n instance
     */
    async stopInstance(userId: string, ipAddress?: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { containerId: true },
        });

        if (!user?.containerId) {
            throw new NotFoundError('No n8n instance found for this user');
        }

        try {
            await execAsync(`docker stop ${user.containerId}`);

            await activityLogService.log({
                userId,
                action: 'n8n_instance_stopped',
                details: { containerId: user.containerId },
                ipAddress,
            });

            logger.info(`n8n instance stopped: ${user.containerId}`);
        } catch (error) {
            logger.error('Failed to stop n8n instance:', error);
            throw new BadRequestError('Failed to stop n8n instance');
        }
    }

    /**
     * Destroy an n8n instance (for cancelled subscriptions)
     */
    async destroyInstance(userId: string, ipAddress?: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { containerId: true },
        });

        if (!user?.containerId) {
            throw new NotFoundError('No n8n instance found for this user');
        }

        try {
            // Stop and remove container
            await execAsync(`docker stop ${user.containerId} && docker rm ${user.containerId}`);

            // Update user record
            await prisma.user.update({
                where: { id: userId },
                data: {
                    containerId: null,
                    instanceUrl: null,
                },
            });

            await activityLogService.log({
                userId,
                action: 'n8n_instance_destroyed',
                details: { containerId: user.containerId },
                ipAddress,
            });

            logger.info(`n8n instance destroyed: ${user.containerId}`);
        } catch (error) {
            logger.error('Failed to destroy n8n instance:', error);
            throw new BadRequestError('Failed to destroy n8n instance');
        }
    }

    /**
     * Get instance status
     */
    async getInstanceStatus(userId: string): Promise<ContainerInfo | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { containerId: true, instanceUrl: true },
        });

        if (!user?.containerId) {
            return null;
        }

        try {
            const { stdout } = await execAsync(
                `docker inspect --format='{{.State.Status}}' ${user.containerId}`
            );

            const status = stdout.trim() as 'running' | 'stopped' | 'error';
            const portMatch = user.instanceUrl?.match(/:(\d+)/);
            const port = portMatch ? parseInt(portMatch[1]) : 0;

            return {
                containerId: user.containerId,
                instanceUrl: user.instanceUrl || '',
                port,
                status: status === 'running' ? 'running' : 'stopped',
            };
        } catch (error) {
            logger.error('Failed to get instance status:', error);
            return {
                containerId: user.containerId,
                instanceUrl: user.instanceUrl || '',
                port: 0,
                status: 'error',
            };
        }
    }

    /**
     * Restart an n8n instance
     */
    async restartInstance(userId: string, ipAddress?: string): Promise<ContainerInfo> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { containerId: true, instanceUrl: true },
        });

        if (!user?.containerId) {
            throw new NotFoundError('No n8n instance found for this user');
        }

        try {
            await execAsync(`docker restart ${user.containerId}`);

            await activityLogService.log({
                userId,
                action: 'n8n_instance_restarted',
                details: { containerId: user.containerId },
                ipAddress,
            });

            const portMatch = user.instanceUrl?.match(/:(\d+)/);
            const port = portMatch ? parseInt(portMatch[1]) : 0;

            return {
                containerId: user.containerId,
                instanceUrl: user.instanceUrl || '',
                port,
                status: 'running',
            };
        } catch (error) {
            logger.error('Failed to restart n8n instance:', error);
            throw new BadRequestError('Failed to restart n8n instance');
        }
    }

    /**
     * Get container logs
     */
    async getInstanceLogs(userId: string, lines: number = 100): Promise<string> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { containerId: true },
        });

        if (!user?.containerId) {
            throw new NotFoundError('No n8n instance found for this user');
        }

        try {
            const { stdout } = await execAsync(
                `docker logs --tail ${lines} ${user.containerId}`
            );
            return stdout;
        } catch (error) {
            logger.error('Failed to get instance logs:', error);
            throw new BadRequestError('Failed to get instance logs');
        }
    }
}

export const dockerService = new DockerService();
