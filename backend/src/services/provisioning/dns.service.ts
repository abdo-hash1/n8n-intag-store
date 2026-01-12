// ===========================================
// DNS Service (Cloudflare)
// ===========================================
// Purpose: Manage DNS records for n8n instances

interface CloudflareConfig {
    apiToken: string;
    zoneId: string;
    domain: string;
}

interface DNSRecord {
    id: string;
    name: string;
    type: string;
    content: string;
    proxied: boolean;
}

interface DNSResult {
    success: boolean;
    recordId?: string;
    error?: string;
}

class DNSService {
    private config: CloudflareConfig;
    private baseUrl = 'https://api.cloudflare.com/client/v4';

    constructor() {
        this.config = {
            apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
            zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
            domain: process.env.N8N_DOMAIN || 'n8n.speak25.online',
        };
    }

    /**
     * Create a DNS A record for a subdomain
     */
    async createRecord(subdomain: string, ipAddress: string): Promise<DNSResult> {
        if (!this.config.apiToken || !this.config.zoneId) {
            return {
                success: false,
                error: 'Cloudflare API token or Zone ID not configured',
            };
        }

        const fullDomain = `${subdomain}.${this.config.domain}`;

        try {
            const response = await fetch(
                `${this.baseUrl}/zones/${this.config.zoneId}/dns_records`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'A',
                        name: fullDomain,
                        content: ipAddress,
                        ttl: 1, // Auto TTL
                        proxied: false, // SSL handled by Traefik
                    }),
                }
            );

            const data = await response.json() as any;

            if (data.success) {
                return {
                    success: true,
                    recordId: data.result.id,
                };
            } else {
                // Check if record already exists
                if (data.errors?.[0]?.code === 81057) {
                    // Record already exists, find and return it
                    const existingRecord = await this.findRecord(subdomain);
                    if (existingRecord) {
                        return {
                            success: true,
                            recordId: existingRecord.id,
                        };
                    }
                }

                return {
                    success: false,
                    error: data.errors?.[0]?.message || 'Failed to create DNS record',
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'DNS API request failed',
            };
        }
    }

    /**
     * Find an existing DNS record by subdomain
     */
    async findRecord(subdomain: string): Promise<DNSRecord | null> {
        if (!this.config.apiToken || !this.config.zoneId) {
            return null;
        }

        const fullDomain = `${subdomain}.${this.config.domain}`;

        try {
            const response = await fetch(
                `${this.baseUrl}/zones/${this.config.zoneId}/dns_records?name=${fullDomain}&type=A`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = await response.json() as any;

            if (data.success && data.result.length > 0) {
                return data.result[0] as DNSRecord;
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Delete a DNS record
     */
    async deleteRecord(subdomain: string): Promise<DNSResult> {
        if (!this.config.apiToken || !this.config.zoneId) {
            return {
                success: false,
                error: 'Cloudflare API token or Zone ID not configured',
            };
        }

        try {
            // First find the record
            const record = await this.findRecord(subdomain);

            if (!record) {
                // Record doesn't exist, consider it a success
                return { success: true };
            }

            const response = await fetch(
                `${this.baseUrl}/zones/${this.config.zoneId}/dns_records/${record.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = await response.json() as any;

            if (data.success) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: data.errors?.[0]?.message || 'Failed to delete DNS record',
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'DNS delete request failed',
            };
        }
    }

    /**
     * Get the full instance URL for a subdomain
     */
    getInstanceUrl(subdomain: string): string {
        return `https://${subdomain}.${this.config.domain}`;
    }

    /**
     * Get the manager IP address
     */
    getManagerIp(): string {
        return process.env.SWARM_MANAGER_IP || '';
    }
}

export const dnsService = new DNSService();
export type { CloudflareConfig, DNSRecord, DNSResult };
