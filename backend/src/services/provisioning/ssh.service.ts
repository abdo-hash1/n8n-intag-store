// ===========================================
// SSH Service
// ===========================================
// Purpose: Execute commands on remote servers via SSH

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface SSHConfig {
    host: string;
    user: string;
    privateKeyPath: string;
}

interface SSHResult {
    success: boolean;
    output: string;
    error?: string;
}

class SSHService {
    private defaultConfig: SSHConfig;

    constructor() {
        this.defaultConfig = {
            host: process.env.SWARM_MANAGER_IP || '',
            user: 'root',
            privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH || '~/.ssh/id_ed25519',
        };
    }

    /**
     * Execute a command on a remote server via SSH
     */
    async executeCommand(
        command: string,
        config?: Partial<SSHConfig>
    ): Promise<SSHResult> {
        const sshConfig = { ...this.defaultConfig, ...config };

        if (!sshConfig.host) {
            return {
                success: false,
                output: '',
                error: 'SSH host not configured',
            };
        }

        // Escape the command for SSH
        const escapedCommand = command.replace(/"/g, '\\"');

        const sshCommand = `ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes -i "${sshConfig.privateKeyPath}" ${sshConfig.user}@${sshConfig.host} "${escapedCommand}"`;

        try {
            const { stdout, stderr } = await execAsync(sshCommand, {
                timeout: 120000, // 2 minute timeout
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            });

            return {
                success: true,
                output: stdout.trim(),
                error: stderr ? stderr.trim() : undefined,
            };
        } catch (error: any) {
            return {
                success: false,
                output: error.stdout || '',
                error: error.message || 'SSH command failed',
            };
        }
    }

    /**
     * Copy a file to a remote server via SCP
     */
    async copyFile(
        localPath: string,
        remotePath: string,
        config?: Partial<SSHConfig>
    ): Promise<SSHResult> {
        const sshConfig = { ...this.defaultConfig, ...config };

        if (!sshConfig.host) {
            return {
                success: false,
                output: '',
                error: 'SSH host not configured',
            };
        }

        const scpCommand = `scp -o StrictHostKeyChecking=accept-new -o BatchMode=yes -i "${sshConfig.privateKeyPath}" "${localPath}" ${sshConfig.user}@${sshConfig.host}:${remotePath}`;

        try {
            const { stdout, stderr } = await execAsync(scpCommand, {
                timeout: 60000, // 1 minute timeout
            });

            return {
                success: true,
                output: stdout.trim(),
                error: stderr ? stderr.trim() : undefined,
            };
        } catch (error: any) {
            return {
                success: false,
                output: error.stdout || '',
                error: error.message || 'SCP command failed',
            };
        }
    }

    /**
     * Write content to a remote file
     */
    async writeRemoteFile(
        content: string,
        remotePath: string,
        config?: Partial<SSHConfig>
    ): Promise<SSHResult> {
        // Write to a temporary local file
        const tempDir = process.env.TEMP || '/tmp';
        const tempFile = path.join(tempDir, `n8n-temp-${Date.now()}.txt`);

        try {
            fs.writeFileSync(tempFile, content);

            // Copy to remote
            const result = await this.copyFile(tempFile, remotePath, config);

            // Clean up temp file
            fs.unlinkSync(tempFile);

            return result;
        } catch (error: any) {
            // Clean up temp file if it exists
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }

            return {
                success: false,
                output: '',
                error: error.message || 'Failed to write remote file',
            };
        }
    }

    /**
     * Check if connection to server is working
     */
    async testConnection(config?: Partial<SSHConfig>): Promise<boolean> {
        const result = await this.executeCommand('echo "connected"', config);
        return result.success && result.output.includes('connected');
    }
}

export const sshService = new SSHService();
export type { SSHConfig, SSHResult };
