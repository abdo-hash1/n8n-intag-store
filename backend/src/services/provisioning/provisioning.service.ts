// ===========================================
// Provisioning Service
// ===========================================
// Purpose: Orchestrate n8n instance provisioning, suspension, and deletion

import { prisma } from '../../config/database.js';
import { sshService } from './ssh.service.js';
import { dnsService } from './dns.service.js';
import * as crypto from 'crypto';

interface ProvisioningResult {
    success: boolean;
    instanceUrl?: string;
    error?: string;
}

class ProvisioningService {
    private n8nDomain: string;
    private managerIp: string;

    constructor() {
        this.n8nDomain = process.env.N8N_DOMAIN || 'n8n.speak25.online';
        this.managerIp = process.env.SWARM_MANAGER_IP || '';
    }

    /**
     * Generate a unique subdomain for a user
     */
    private generateSubdomain(userId: string): string {
        // Create a short hash from the user ID
        const hash = crypto.createHash('md5').update(userId).digest('hex').substring(0, 8);
        return `n8n-${hash}`;
    }

    /**
     * Generate a secure random string
     */
    private generateSecureString(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex').substring(0, length);
    }

    /**
     * Generate Docker Compose content for an n8n instance
     */
    private generateDockerCompose(
        subdomain: string,
        dbName: string,
        dbUser: string,
        dbPassword: string,
        encryptionKey: string
    ): string {
        const fullDomain = `${subdomain}.${this.n8nDomain}`;
        const postgresHost = this.managerIp;

        return `version: "3.8"
services:
  ${subdomain}:
    image: n8nio/n8n:latest
    container_name: ${subdomain}
    restart: unless-stopped
    networks:
      - n8n-cluster
    environment:
      - N8N_HOST=${fullDomain}
      - N8N_PROTOCOL=https
      - N8N_PORT=5678
      - WEBHOOK_URL=https://${fullDomain}/
      - GENERIC_TIMEZONE=Africa/Cairo
      - N8N_ENCRYPTION_KEY=${encryptionKey}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=${postgresHost}
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${dbName}
      - DB_POSTGRESDB_USER=${dbUser}
      - DB_POSTGRESDB_PASSWORD=${dbPassword}
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    labels:
      - traefik.enable=true
      - "traefik.http.routers.${subdomain}.rule=Host(\`${fullDomain}\`)"
      - traefik.http.routers.${subdomain}.entrypoints=websecure
      - traefik.http.routers.${subdomain}.tls=true
      - traefik.http.routers.${subdomain}.tls.certresolver=letsencrypt
      - traefik.http.services.${subdomain}.loadbalancer.server.port=5678
networks:
  n8n-cluster:
    external: true
`;
    }

    /**
     * Provision a new n8n instance for a user
     */
    async provisionInstance(userId: string): Promise<ProvisioningResult> {
        const startTime = Date.now();
        let logId: string | null = null;

        try {
            // Check if user already has an instance
            const existingInstance = await prisma.n8nInstance.findUnique({
                where: { userId },
            });

            if (existingInstance && existingInstance.status !== 'deleted') {
                return {
                    success: false,
                    error: 'User already has an active instance',
                };
            }

            // Generate instance configuration
            const subdomain = this.generateSubdomain(userId);
            const dbName = `n8n_${subdomain.replace(/-/g, '_')}`;
            const dbUser = `user_${subdomain.replace(/-/g, '_')}`;
            const dbPassword = this.generateSecureString(24);
            const encryptionKey = this.generateSecureString(32);

            // Create or update instance record
            const instance = await prisma.n8nInstance.upsert({
                where: { userId },
                update: {
                    subdomain,
                    status: 'provisioning',
                    dbName,
                    dbUser,
                    dbPassword,
                    encryptionKey,
                    lastError: null,
                    errorCount: 0,
                },
                create: {
                    userId,
                    subdomain,
                    status: 'provisioning',
                    dbName,
                    dbUser,
                    dbPassword,
                    encryptionKey,
                },
            });

            // Create provisioning log
            const log = await prisma.provisioningLog.create({
                data: {
                    instanceId: instance.id,
                    action: 'provision',
                    status: 'started',
                    triggeredBy: 'system',
                },
            });
            logId = log.id;

            // Step 1: Create PostgreSQL database
            console.log(`[Provisioning] Creating database for ${subdomain}...`);
            const createDbResult = await sshService.executeCommand(
                `docker exec postgres psql -U n8n_admin -c "CREATE DATABASE ${dbName};" && ` +
                `docker exec postgres psql -U n8n_admin -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}';" && ` +
                `docker exec postgres psql -U n8n_admin -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};" && ` +
                `docker exec postgres psql -U n8n_admin -d ${dbName} -c "GRANT ALL ON SCHEMA public TO ${dbUser};"`,
                { host: this.managerIp }
            );

            if (!createDbResult.success) {
                throw new Error(`Database creation failed: ${createDbResult.error}`);
            }

            // Step 2: Generate and deploy Docker Compose file
            console.log(`[Provisioning] Deploying container for ${subdomain}...`);
            const composeContent = this.generateDockerCompose(
                subdomain,
                dbName,
                dbUser,
                dbPassword,
                encryptionKey
            );

            const remotePath = `/tmp/${subdomain}-compose.yml`;
            const writeResult = await sshService.writeRemoteFile(
                composeContent,
                remotePath,
                { host: this.managerIp }
            );

            if (!writeResult.success) {
                throw new Error(`Failed to write compose file: ${writeResult.error}`);
            }

            // Step 3: Start the container using Docker Compose
            const deployResult = await sshService.executeCommand(
                `cd /tmp && docker compose -f ${subdomain}-compose.yml up -d`,
                { host: this.managerIp }
            );

            if (!deployResult.success) {
                throw new Error(`Container deployment failed: ${deployResult.error}`);
            }

            // Step 4: Update instance status
            const instanceUrl = dnsService.getInstanceUrl(subdomain);

            await prisma.n8nInstance.update({
                where: { id: instance.id },
                data: {
                    status: 'active',
                    containerId: subdomain,
                    webhookUrl: `${instanceUrl}/webhook`,
                    provisionedAt: new Date(),
                },
            });

            // Update provisioning log
            await prisma.provisioningLog.update({
                where: { id: logId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    durationMs: Date.now() - startTime,
                    details: JSON.stringify({ subdomain, instanceUrl }),
                },
            });

            console.log(`[Provisioning] Instance ${subdomain} provisioned successfully`);

            return {
                success: true,
                instanceUrl,
            };
        } catch (error: any) {
            console.error(`[Provisioning] Error: ${error.message}`);

            // Update instance status on failure
            try {
                await prisma.n8nInstance.updateMany({
                    where: { userId },
                    data: {
                        status: 'error',
                        lastError: error.message,
                        errorCount: { increment: 1 },
                    },
                });

                if (logId) {
                    await prisma.provisioningLog.update({
                        where: { id: logId },
                        data: {
                            status: 'failed',
                            completedAt: new Date(),
                            durationMs: Date.now() - startTime,
                            error: error.message,
                        },
                    });
                }
            } catch (dbError) {
                console.error('[Provisioning] Failed to update error status:', dbError);
            }

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Suspend an n8n instance (stop the container)
     */
    async suspendInstance(userId: string): Promise<ProvisioningResult> {
        const startTime = Date.now();
        let logId: string | null = null;

        try {
            const instance = await prisma.n8nInstance.findUnique({
                where: { userId },
            });

            if (!instance || instance.status === 'deleted') {
                return {
                    success: false,
                    error: 'Instance not found',
                };
            }

            if (instance.status === 'suspended') {
                return { success: true };
            }

            // Create provisioning log
            const log = await prisma.provisioningLog.create({
                data: {
                    instanceId: instance.id,
                    action: 'suspend',
                    status: 'started',
                    triggeredBy: 'system',
                },
            });
            logId = log.id;

            // Stop the container
            console.log(`[Provisioning] Suspending instance ${instance.subdomain}...`);
            const stopResult = await sshService.executeCommand(
                `docker stop ${instance.subdomain}`,
                { host: this.managerIp }
            );

            if (!stopResult.success && !stopResult.error?.includes('No such container')) {
                throw new Error(`Failed to stop container: ${stopResult.error}`);
            }

            // Update instance status
            await prisma.n8nInstance.update({
                where: { id: instance.id },
                data: {
                    status: 'suspended',
                    suspendedAt: new Date(),
                },
            });

            // Update provisioning log
            await prisma.provisioningLog.update({
                where: { id: logId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    durationMs: Date.now() - startTime,
                },
            });

            console.log(`[Provisioning] Instance ${instance.subdomain} suspended`);

            return { success: true };
        } catch (error: any) {
            console.error(`[Provisioning] Suspend error: ${error.message}`);

            if (logId) {
                await prisma.provisioningLog.update({
                    where: { id: logId },
                    data: {
                        status: 'failed',
                        completedAt: new Date(),
                        durationMs: Date.now() - startTime,
                        error: error.message,
                    },
                });
            }

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Resume a suspended n8n instance
     */
    async resumeInstance(userId: string): Promise<ProvisioningResult> {
        const startTime = Date.now();
        let logId: string | null = null;

        try {
            const instance = await prisma.n8nInstance.findUnique({
                where: { userId },
            });

            if (!instance || instance.status === 'deleted') {
                return {
                    success: false,
                    error: 'Instance not found',
                };
            }

            if (instance.status === 'active') {
                return {
                    success: true,
                    instanceUrl: dnsService.getInstanceUrl(instance.subdomain),
                };
            }

            // Create provisioning log
            const log = await prisma.provisioningLog.create({
                data: {
                    instanceId: instance.id,
                    action: 'resume',
                    status: 'started',
                    triggeredBy: 'system',
                },
            });
            logId = log.id;

            // Update status to resuming
            await prisma.n8nInstance.update({
                where: { id: instance.id },
                data: { status: 'resuming' },
            });

            // Start the container
            console.log(`[Provisioning] Resuming instance ${instance.subdomain}...`);
            const startResult = await sshService.executeCommand(
                `docker start ${instance.subdomain}`,
                { host: this.managerIp }
            );

            if (!startResult.success) {
                throw new Error(`Failed to start container: ${startResult.error}`);
            }

            // Update instance status
            const instanceUrl = dnsService.getInstanceUrl(instance.subdomain);

            await prisma.n8nInstance.update({
                where: { id: instance.id },
                data: {
                    status: 'active',
                    suspendedAt: null,
                },
            });

            // Update provisioning log
            await prisma.provisioningLog.update({
                where: { id: logId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    durationMs: Date.now() - startTime,
                },
            });

            console.log(`[Provisioning] Instance ${instance.subdomain} resumed`);

            return {
                success: true,
                instanceUrl,
            };
        } catch (error: any) {
            console.error(`[Provisioning] Resume error: ${error.message}`);

            // Revert status on failure
            try {
                await prisma.n8nInstance.updateMany({
                    where: { userId },
                    data: { status: 'suspended' },
                });

                if (logId) {
                    await prisma.provisioningLog.update({
                        where: { id: logId },
                        data: {
                            status: 'failed',
                            completedAt: new Date(),
                            durationMs: Date.now() - startTime,
                            error: error.message,
                        },
                    });
                }
            } catch (dbError) {
                console.error('[Provisioning] Failed to update error status:', dbError);
            }

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Delete an n8n instance completely
     */
    async deleteInstance(userId: string): Promise<ProvisioningResult> {
        const startTime = Date.now();
        let logId: string | null = null;

        try {
            const instance = await prisma.n8nInstance.findUnique({
                where: { userId },
            });

            if (!instance) {
                return { success: true }; // Already deleted
            }

            if (instance.status === 'deleted') {
                return { success: true };
            }

            // Create provisioning log
            const log = await prisma.provisioningLog.create({
                data: {
                    instanceId: instance.id,
                    action: 'delete',
                    status: 'started',
                    triggeredBy: 'system',
                },
            });
            logId = log.id;

            // Update status to deleting
            await prisma.n8nInstance.update({
                where: { id: instance.id },
                data: { status: 'deleting' },
            });

            console.log(`[Provisioning] Deleting instance ${instance.subdomain}...`);

            // Step 1: Stop and remove the container
            await sshService.executeCommand(
                `docker stop ${instance.subdomain} 2>/dev/null; docker rm ${instance.subdomain} 2>/dev/null`,
                { host: this.managerIp }
            );

            // Step 2: Remove the compose file
            await sshService.executeCommand(
                `rm -f /tmp/${instance.subdomain}-compose.yml`,
                { host: this.managerIp }
            );

            // Step 3: Drop the database and user (optional, keep for data retention)
            if (instance.dbName && instance.dbUser) {
                await sshService.executeCommand(
                    `docker exec postgres psql -U n8n_admin -c "DROP DATABASE IF EXISTS ${instance.dbName};" && ` +
                    `docker exec postgres psql -U n8n_admin -c "DROP USER IF EXISTS ${instance.dbUser};"`,
                    { host: this.managerIp }
                );
            }

            // Update instance status
            await prisma.n8nInstance.update({
                where: { id: instance.id },
                data: {
                    status: 'deleted',
                    deletedAt: new Date(),
                    containerId: null,
                },
            });

            // Update provisioning log
            await prisma.provisioningLog.update({
                where: { id: logId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    durationMs: Date.now() - startTime,
                },
            });

            console.log(`[Provisioning] Instance ${instance.subdomain} deleted`);

            return { success: true };
        } catch (error: any) {
            console.error(`[Provisioning] Delete error: ${error.message}`);

            if (logId) {
                await prisma.provisioningLog.update({
                    where: { id: logId },
                    data: {
                        status: 'failed',
                        completedAt: new Date(),
                        durationMs: Date.now() - startTime,
                        error: error.message,
                    },
                });
            }

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get the status of a user's n8n instance
     */
    async getInstanceStatus(userId: string) {
        const instance = await prisma.n8nInstance.findUnique({
            where: { userId },
            select: {
                id: true,
                subdomain: true,
                status: true,
                provisionedAt: true,
                suspendedAt: true,
                lastError: true,
            },
        });

        if (!instance) {
            return null;
        }

        return {
            ...instance,
            instanceUrl: instance.status !== 'deleted'
                ? dnsService.getInstanceUrl(instance.subdomain)
                : null,
        };
    }

    /**
     * Schedule instance deletion (for cancelled subscriptions)
     */
    async scheduleInstanceDeletion(
        userId: string,
        deleteAfterDays: number = 30
    ): Promise<ProvisioningResult> {
        try {
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + deleteAfterDays);

            await prisma.n8nInstance.updateMany({
                where: { userId },
                data: {
                    scheduledDeleteAt: scheduledDate,
                },
            });

            console.log(`[Provisioning] Instance scheduled for deletion on ${scheduledDate.toISOString()}`);

            return { success: true };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

export const provisioningService = new ProvisioningService();
export type { ProvisioningResult };
