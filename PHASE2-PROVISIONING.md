# Phase 2: n8n Instance Provisioning System

> **Status**: Planning Complete - Ready for Implementation  
> **Priority**: HIGH  
> **Estimated Effort**: 2-3 weeks

This document outlines the implementation plan for automated n8n instance provisioning integrated with the subscription system.

---

## 🎯 Objective

Automatically provision, suspend, and delete n8n instances based on customer subscription status:

- **New Subscription + Payment** → Create n8n instance
- **Payment Failed** → Suspend instance (after grace period)
- **Payment Recovered** → Resume instance
- **Subscription Cancelled** → Delete instance (after 30-day retention)

---

## 🏗️ Architecture Decision

### Chosen: Docker Swarm Cluster on Hetzner ARM64

**Why this architecture:**
- ✅ **Cost-effective**: ~€2-3 per customer vs €8+ with dedicated servers
- ✅ **Scalable**: Add worker nodes automatically as needed
- ✅ **Simple**: Docker Swarm is easier than Kubernetes
- ✅ **ARM64**: Hetzner CAX series offers best price/performance
- ✅ **Share infrastructure**: One PostgreSQL, Redis, Traefik for all

### Server Components

| Component | Server | Specs | Purpose | Cost |
|-----------|--------|-------|---------|------|
| Load Balancer | CAX11 | 2 vCPU, 4GB | Traefik + SSL | €3.79/mo |
| Services | CAX21 | 4 vCPU, 8GB | PostgreSQL, Redis, Coolify | €6.49/mo |
| Worker 1 | CAX31 | 8 vCPU, 16GB | 8 n8n instances | €12.49/mo |
| Worker N | CAX31 | 8 vCPU, 16GB | 8 n8n instances | €12.49/mo |

### n8n Instance Specs (per customer)

| Resource | Allocation |
|----------|------------|
| RAM | 2GB limit |
| CPU | 1 core limit |
| Database | Separate PostgreSQL database |
| Storage | Persistent volume for .n8n folder |

---

## 📊 Database Schema Changes

### Add to `schema.prisma`:

```prisma
// ===========================================
// N8N INSTANCE TABLE
// ===========================================
// Purpose: Track individual n8n instances per customer

model N8nInstance {
  id               String         @id @default(uuid())
  userId           String         @unique
  
  // Instance Configuration
  subdomain        String         @unique  // e.g., "customer123" for customer123.n8n.yoursite.com
  status           InstanceStatus @default(PENDING)
  
  // Resource Allocation
  allocatedRam     Int            @default(2048)  // MB
  allocatedCpu     Int            @default(1)     // cores
  
  // Docker/Swarm Details
  serviceId        String?        @map("service_id")     // Docker service ID
  containerId      String?        @map("container_id")   // For quick access
  
  // Database Details
  dbName           String?        @map("db_name")
  dbUser           String?        @map("db_user")
  dbPassword       String?        @map("db_password")    // Encrypted
  
  // n8n Configuration
  encryptionKey    String?        @map("encryption_key") // n8n encryption key
  webhookUrl       String?        @map("webhook_url")
  
  // Cluster Assignment
  workerId         String?        @map("worker_id")
  worker           ClusterNode?   @relation(fields: [workerId], references: [id])
  
  // Timestamps
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")
  provisionedAt    DateTime?      @map("provisioned_at")
  suspendedAt      DateTime?      @map("suspended_at")
  scheduledDeleteAt DateTime?     @map("scheduled_delete_at")
  
  // Relations
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("n8n_instances")
}

// ===========================================
// CLUSTER NODES TABLE
// ===========================================
// Purpose: Track Hetzner servers in the cluster

model ClusterNode {
  id           String     @id @default(uuid())
  name         String     @unique
  
  // Hetzner Details
  hetznerId    String     @unique @map("hetzner_id")
  serverType   String     @map("server_type")  // cax31, cax41, etc.
  ip           String
  location     String     @default("fsn1")     // Falkenstein
  
  // Node Type
  nodeType     NodeType   @map("node_type")    // manager, worker, services
  
  // Capacity
  maxInstances Int        @default(8) @map("max_instances")
  currentLoad  Int        @default(0) @map("current_load")
  
  // Status
  status       NodeStatus @default(PROVISIONING)
  lastHealthCheck DateTime? @map("last_health_check")
  
  // Timestamps
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")
  
  // Relations
  instances    N8nInstance[]

  @@map("cluster_nodes")
}

// ===========================================
// PROVISIONING LOGS TABLE
// ===========================================
// Purpose: Audit trail for provisioning operations

model ProvisioningLog {
  id           String   @id @default(uuid())
  instanceId   String?  @map("instance_id")
  nodeId       String?  @map("node_id")
  
  action       String   // create_instance, suspend_instance, delete_instance, add_node, etc.
  status       String   // pending, in_progress, success, failed
  details      String?  // JSON for additional context
  error        String?
  
  startedAt    DateTime @default(now()) @map("started_at")
  completedAt  DateTime? @map("completed_at")

  @@map("provisioning_logs")
}

// Enums
enum InstanceStatus {
  PENDING
  PROVISIONING
  ACTIVE
  SUSPENDED
  RESUMING
  DELETING
  DELETED
  ERROR
}

enum NodeType {
  MANAGER
  WORKER
  SERVICES
}

enum NodeStatus {
  PROVISIONING
  ACTIVE
  DRAINING
  MAINTENANCE
  OFFLINE
  DELETING
}
```

---

## 📁 New Files to Create

### Directory Structure

```
backend/src/
├── services/
│   ├── provisioning/
│   │   ├── index.ts                 # Main provisioning service
│   │   ├── hetzner.service.ts       # Hetzner Cloud API
│   │   ├── swarm.service.ts         # Docker Swarm management
│   │   ├── database.service.ts      # PostgreSQL database creation
│   │   ├── dns.service.ts           # Cloudflare DNS
│   │   └── health.service.ts        # Instance health checks
│   └── ...
├── controllers/
│   └── provisioning.controller.ts   # Admin endpoints
├── routes/
│   └── provisioning.routes.ts
└── jobs/
    ├── index.ts                     # Job queue setup
    ├── provision.job.ts             # Async provisioning
    ├── suspend.job.ts               # Suspension handling
    ├── cleanup.job.ts               # Delete old instances
    └── healthCheck.job.ts           # Periodic health checks
```

---

## 🔧 Service Implementations

### 1. Hetzner Service

```typescript
// backend/src/services/provisioning/hetzner.service.ts

import { HetznerCloud } from 'hcloud-js';

interface CreateServerOptions {
  name: string;
  serverType: 'cax11' | 'cax21' | 'cax31' | 'cax41';
  location?: 'fsn1' | 'nbg1' | 'hel1';
  sshKeyId: string;
  labels?: Record<string, string>;
}

class HetznerService {
  private client: HetznerCloud;

  constructor() {
    this.client = new HetznerCloud({ token: process.env.HETZNER_API_TOKEN! });
  }

  async createServer(options: CreateServerOptions): Promise<Server> {
    const server = await this.client.servers.create({
      name: options.name,
      server_type: options.serverType,
      location: options.location || 'fsn1',
      image: 'docker-ce',  // Pre-installed Docker image
      ssh_keys: [options.sshKeyId],
      labels: options.labels || {},
      user_data: this.getCloudInitScript()
    });

    return server;
  }

  async deleteServer(hetznerId: string): Promise<void> {
    await this.client.servers.delete(hetznerId);
  }

  async getServer(hetznerId: string): Promise<Server | null> {
    try {
      return await this.client.servers.get(hetznerId);
    } catch {
      return null;
    }
  }

  private getCloudInitScript(): string {
    return `#!/bin/bash
# Install Docker Compose
apt-get update && apt-get install -y docker-compose-plugin

# Configure Docker daemon for swarm
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
`;
  }
}

export const hetznerService = new HetznerService();
```

### 2. Swarm Service

```typescript
// backend/src/services/provisioning/swarm.service.ts

import { NodeSSH } from 'node-ssh';

interface DeployN8nOptions {
  customerId: string;
  subdomain: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  encryptionKey: string;
  resourceLimits: {
    memory: string;  // "2G"
    cpus: string;    // "1"
  };
}

class SwarmService {
  private managerIp: string;
  private ssh: NodeSSH;

  constructor() {
    this.managerIp = process.env.SWARM_MANAGER_IP!;
    this.ssh = new NodeSSH();
  }

  async connect(): Promise<void> {
    await this.ssh.connect({
      host: this.managerIp,
      username: 'root',
      privateKey: process.env.SSH_PRIVATE_KEY!
    });
  }

  async deployN8nService(options: DeployN8nOptions): Promise<string> {
    const serviceName = `n8n-${options.customerId}`;
    
    const command = `docker service create \
      --name ${serviceName} \
      --network n8n-cluster \
      --limit-memory ${options.resourceLimits.memory} \
      --limit-cpu ${options.resourceLimits.cpus} \
      --reserve-memory 1G \
      --reserve-cpu 0.5 \
      --constraint 'node.labels.type==worker' \
      --label traefik.enable=true \
      --label "traefik.http.routers.${serviceName}.rule=Host(\`${options.subdomain}.n8n.yoursite.com\`)" \
      --label traefik.http.routers.${serviceName}.tls=true \
      --label traefik.http.routers.${serviceName}.tls.certresolver=letsencrypt \
      --label traefik.http.services.${serviceName}.loadbalancer.server.port=5678 \
      --env N8N_HOST=${options.subdomain}.n8n.yoursite.com \
      --env WEBHOOK_URL=https://${options.subdomain}.n8n.yoursite.com/ \
      --env N8N_ENCRYPTION_KEY=${options.encryptionKey} \
      --env DB_TYPE=postgresdb \
      --env DB_POSTGRESDB_HOST=postgres \
      --env DB_POSTGRESDB_DATABASE=${options.dbName} \
      --env DB_POSTGRESDB_USER=${options.dbUser} \
      --env DB_POSTGRESDB_PASSWORD=${options.dbPassword} \
      --env EXECUTIONS_MODE=queue \
      --env QUEUE_BULL_REDIS_HOST=redis \
      --env N8N_METRICS=true \
      --env EXECUTIONS_DATA_SAVE_ON_SUCCESS=none \
      --env EXECUTIONS_DATA_PRUNE=true \
      --env EXECUTIONS_DATA_MAX_AGE=168 \
      --mount type=volume,source=n8n-${options.customerId}-data,target=/home/node/.n8n \
      n8nio/n8n:latest`;

    const result = await this.ssh.execCommand(command);
    
    if (result.code !== 0) {
      throw new Error(`Failed to deploy n8n: ${result.stderr}`);
    }

    return serviceName;
  }

  async scaleService(serviceName: string, replicas: number): Promise<void> {
    await this.ssh.execCommand(`docker service scale ${serviceName}=${replicas}`);
  }

  async removeService(serviceName: string): Promise<void> {
    await this.ssh.execCommand(`docker service rm ${serviceName}`);
  }

  async getServiceStatus(serviceName: string): Promise<'running' | 'stopped' | 'not_found'> {
    const result = await this.ssh.execCommand(
      `docker service inspect ${serviceName} --format '{{.Spec.Mode.Replicated.Replicas}}'`
    );
    
    if (result.code !== 0) return 'not_found';
    
    const replicas = parseInt(result.stdout.trim());
    return replicas > 0 ? 'running' : 'stopped';
  }

  async joinSwarm(serverIp: string, workerToken: string): Promise<void> {
    const nodeSSH = new NodeSSH();
    await nodeSSH.connect({
      host: serverIp,
      username: 'root',
      privateKey: process.env.SSH_PRIVATE_KEY!
    });

    await nodeSSH.execCommand(
      `docker swarm join --token ${workerToken} ${this.managerIp}:2377`
    );

    nodeSSH.dispose();
  }

  async labelNode(nodeName: string, labels: Record<string, string>): Promise<void> {
    const labelArgs = Object.entries(labels)
      .map(([key, value]) => `--label-add ${key}=${value}`)
      .join(' ');
    
    await this.ssh.execCommand(`docker node update ${labelArgs} ${nodeName}`);
  }

  disconnect(): void {
    this.ssh.dispose();
  }
}

export const swarmService = new SwarmService();
```

### 3. Provisioning Service (Main)

```typescript
// backend/src/services/provisioning/index.ts

import { prisma } from '@/config/database';
import { hetznerService } from './hetzner.service';
import { swarmService } from './swarm.service';
import { databaseService } from './database.service';
import { dnsService } from './dns.service';
import { emailService } from '@/services/email.service';
import { generateSecurePassword } from '@/utils/password';

class ProvisioningService {
  
  async provisionInstance(userId: string, subscriptionId: string): Promise<N8nInstance> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Check for existing instance
    const existing = await prisma.n8nInstance.findUnique({ where: { userId } });
    if (existing && existing.status !== 'DELETED') {
      throw new Error('User already has an instance');
    }

    // Generate unique subdomain
    const subdomain = await this.generateSubdomain(userId);

    // Create instance record
    const instance = await prisma.n8nInstance.create({
      data: {
        userId,
        subdomain,
        status: 'PROVISIONING'
      }
    });

    try {
      // 1. Find or create worker node
      let worker = await this.findAvailableWorker();
      if (!worker) {
        worker = await this.addWorkerNode();
      }

      // 2. Create database for customer
      const dbPassword = generateSecurePassword(32);
      const dbName = `n8n_${userId.replace(/-/g, '_').substring(0, 20)}`;
      const dbUser = dbName;
      
      await databaseService.createDatabase(dbName, dbUser, dbPassword);

      // 3. Generate encryption key
      const encryptionKey = generateSecurePassword(32);

      // 4. Deploy n8n container
      await swarmService.connect();
      const serviceId = await swarmService.deployN8nService({
        customerId: userId,
        subdomain,
        dbName,
        dbUser,
        dbPassword,
        encryptionKey,
        resourceLimits: { memory: '2G', cpus: '1' }
      });
      swarmService.disconnect();

      // 5. Configure DNS
      await dnsService.createRecord(subdomain, process.env.LOAD_BALANCER_IP!);

      // 6. Wait for container to be healthy
      await this.waitForHealthy(subdomain);

      // 7. Update instance record
      const updated = await prisma.n8nInstance.update({
        where: { id: instance.id },
        data: {
          status: 'ACTIVE',
          serviceId,
          dbName,
          dbUser,
          dbPassword, // Consider encrypting this
          encryptionKey,
          webhookUrl: `https://${subdomain}.n8n.yoursite.com/`,
          workerId: worker.id,
          provisionedAt: new Date()
        }
      });

      // 8. Update user record
      await prisma.user.update({
        where: { id: userId },
        data: {
          instanceUrl: `https://${subdomain}.n8n.yoursite.com`
        }
      });

      // 9. Increment worker load
      await prisma.clusterNode.update({
        where: { id: worker.id },
        data: { currentLoad: { increment: 1 } }
      });

      // 10. Send welcome email
      await emailService.sendN8nInstanceReady({
        to: user.email,
        name: user.fullName,
        instanceUrl: `https://${subdomain}.n8n.yoursite.com`,
        subdomain
      });

      // 11. Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'n8n_instance_created',
          details: JSON.stringify({ subdomain, workerId: worker.id })
        }
      });

      return updated;

    } catch (error) {
      // Rollback on failure
      await prisma.n8nInstance.update({
        where: { id: instance.id },
        data: { status: 'ERROR' }
      });

      await prisma.provisioningLog.create({
        data: {
          instanceId: instance.id,
          action: 'create_instance',
          status: 'failed',
          error: error.message
        }
      });

      throw error;
    }
  }

  async suspendInstance(userId: string): Promise<void> {
    const instance = await prisma.n8nInstance.findUnique({ where: { userId } });
    if (!instance) throw new Error('Instance not found');

    await swarmService.connect();
    await swarmService.scaleService(`n8n-${userId}`, 0);
    swarmService.disconnect();

    await prisma.n8nInstance.update({
      where: { userId },
      data: { 
        status: 'SUSPENDED',
        suspendedAt: new Date()
      }
    });

    // Update user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendN8nInstanceSuspended({
        to: user.email,
        name: user.fullName,
        reason: 'Payment failed'
      });
    }
  }

  async resumeInstance(userId: string): Promise<void> {
    const instance = await prisma.n8nInstance.findUnique({ where: { userId } });
    if (!instance) throw new Error('Instance not found');

    await prisma.n8nInstance.update({
      where: { userId },
      data: { status: 'RESUMING' }
    });

    await swarmService.connect();
    await swarmService.scaleService(`n8n-${userId}`, 1);
    swarmService.disconnect();

    await this.waitForHealthy(instance.subdomain);

    await prisma.n8nInstance.update({
      where: { userId },
      data: { 
        status: 'ACTIVE',
        suspendedAt: null
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await emailService.sendN8nInstanceResumed({
        to: user.email,
        name: user.fullName,
        instanceUrl: `https://${instance.subdomain}.n8n.yoursite.com`
      });
    }
  }

  async deleteInstance(userId: string): Promise<void> {
    const instance = await prisma.n8nInstance.findUnique({ 
      where: { userId },
      include: { worker: true }
    });
    if (!instance) return;

    try {
      // Remove service
      await swarmService.connect();
      await swarmService.removeService(`n8n-${userId}`);
      swarmService.disconnect();

      // Remove DNS record
      await dnsService.deleteRecord(instance.subdomain);

      // Drop database (keep for 30 days in backup)
      // await databaseService.dropDatabase(instance.dbName);

      // Update worker load
      if (instance.workerId) {
        await prisma.clusterNode.update({
          where: { id: instance.workerId },
          data: { currentLoad: { decrement: 1 } }
        });
      }

    } catch (error) {
      console.error('Error during deletion:', error);
    }

    // Mark as deleted
    await prisma.n8nInstance.update({
      where: { userId },
      data: { status: 'DELETED' }
    });

    // Clear user instance URL
    await prisma.user.update({
      where: { id: userId },
      data: { instanceUrl: null, containerId: null }
    });
  }

  async findAvailableWorker(): Promise<ClusterNode | null> {
    return await prisma.clusterNode.findFirst({
      where: {
        nodeType: 'WORKER',
        status: 'ACTIVE',
        currentLoad: { lt: prisma.clusterNode.fields.maxInstances }
      },
      orderBy: { currentLoad: 'asc' }
    });
  }

  async addWorkerNode(): Promise<ClusterNode> {
    const nodeName = `n8n-worker-${Date.now()}`;

    // Create Hetzner server
    const server = await hetznerService.createServer({
      name: nodeName,
      serverType: 'cax31',
      sshKeyId: process.env.HETZNER_SSH_KEY_ID!,
      labels: { role: 'n8n-worker', environment: 'production' }
    });

    // Wait for server to be ready
    await this.waitForServerReady(server.id);

    // Join swarm
    const workerToken = process.env.SWARM_WORKER_TOKEN!;
    await swarmService.joinSwarm(server.publicNet.ipv4.ip, workerToken);

    // Label the node
    await swarmService.connect();
    await swarmService.labelNode(nodeName, { type: 'worker' });
    swarmService.disconnect();

    // Save to database
    return await prisma.clusterNode.create({
      data: {
        name: nodeName,
        hetznerId: String(server.id),
        serverType: 'cax31',
        ip: server.publicNet.ipv4.ip,
        nodeType: 'WORKER',
        status: 'ACTIVE',
        maxInstances: 8,
        currentLoad: 0
      }
    });
  }

  private async generateSubdomain(userId: string): Promise<string> {
    // Use first part of UUID to create subdomain
    const base = userId.split('-')[0];
    let subdomain = base;
    let counter = 1;

    while (await prisma.n8nInstance.findFirst({ where: { subdomain } })) {
      subdomain = `${base}${counter}`;
      counter++;
    }

    return subdomain;
  }

  private async waitForHealthy(subdomain: string, maxAttempts = 30): Promise<void> {
    const url = `https://${subdomain}.n8n.yoursite.com/healthz`;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(url, { timeout: 5000 });
        if (response.ok) return;
      } catch {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
    }

    throw new Error('Instance failed to become healthy within timeout');
  }

  private async waitForServerReady(hetznerId: number, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const server = await hetznerService.getServer(String(hetznerId));
      if (server?.status === 'running') {
        // Additional wait for SSH to be ready
        await new Promise(resolve => setTimeout(resolve, 30000));
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    throw new Error('Server failed to start within timeout');
  }
}

export const provisioningService = new ProvisioningService();
```

---

## 🔗 Integration with Subscription Events

### Modify `subscription.service.ts`:

```typescript
// Add imports
import { provisioningService } from './provisioning';

// In subscription creation (after successful payment)
async handlePaymentSuccess(userId: string, paymentId: string) {
  // ... existing logic ...

  // Provision n8n instance
  try {
    await provisioningService.provisionInstance(userId, subscription.id);
  } catch (error) {
    console.error('Failed to provision instance:', error);
    // Don't fail the subscription - instance can be retried
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'n8n_provisioning_failed',
        details: JSON.stringify({ error: error.message })
      }
    });
  }
}

// When payment fails after grace period
async handleSuspension(userId: string) {
  // ... existing logic ...
  
  await provisioningService.suspendInstance(userId);
}

// When payment recovers
async handlePaymentRecovered(userId: string) {
  // ... existing logic ...
  
  await provisioningService.resumeInstance(userId);
}

// When subscription is cancelled
async handleCancellation(userId: string) {
  // ... existing logic ...
  
  // Schedule deletion in 30 days
  await prisma.n8nInstance.update({
    where: { userId },
    data: { scheduledDeleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
  });
  
  // Suspend immediately
  await provisioningService.suspendInstance(userId);
}
```

---

## 📮 New Email Templates

Add to `email.service.ts`:

```typescript
// n8n Instance Ready
async sendN8nInstanceReady(params: {
  to: string;
  name: string;
  instanceUrl: string;
  subdomain: string;
}) {
  const template = `
    <h1>Your n8n Instance is Ready! 🎉</h1>
    <p>Hello ${params.name},</p>
    <p>Great news! Your personal n8n automation instance has been provisioned and is ready to use.</p>
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Access Your Instance</h3>
      <p><strong>URL:</strong> <a href="${params.instanceUrl}">${params.instanceUrl}</a></p>
    </div>
    <h3>Getting Started</h3>
    <ol>
      <li>Visit your instance URL</li>
      <li>Create your admin account (first-time setup)</li>
      <li>Start building your automations!</li>
    </ol>
    <p>Need help? Check out the <a href="https://docs.n8n.io">n8n documentation</a> or contact our support team.</p>
  `;
  
  await this.send(params.to, 'Your n8n Instance is Ready! 🎉', template);
}

// Instance Suspended
async sendN8nInstanceSuspended(params: {
  to: string;
  name: string;
  reason: string;
}) {
  // ... template for suspension notification
}

// Instance Resumed
async sendN8nInstanceResumed(params: {
  to: string;
  name: string;
  instanceUrl: string;
}) {
  // ... template for resumption notification
}
```

---

## 🔧 Environment Variables to Add

```env
# Hetzner Cloud
HETZNER_API_TOKEN="your-hetzner-api-token"
HETZNER_SSH_KEY_ID="12345"

# Docker Swarm
SWARM_MANAGER_IP="1.2.3.4"
SWARM_WORKER_TOKEN="SWMTKN-1-xxx"
SSH_PRIVATE_KEY="/path/to/private/key or key contents"

# Load Balancer
LOAD_BALANCER_IP="5.6.7.8"

# Cloudflare DNS
CLOUDFLARE_API_TOKEN="your-cloudflare-token"
CLOUDFLARE_ZONE_ID="your-zone-id"
N8N_DOMAIN="n8n.yoursite.com"

# PostgreSQL (shared)
SHARED_POSTGRES_HOST="postgres-host"
SHARED_POSTGRES_ADMIN_USER="postgres"
SHARED_POSTGRES_ADMIN_PASSWORD="admin-password"
```

---

## ✅ Implementation Checklist

### Week 1: Infrastructure Setup
- [ ] Set up Hetzner account and API access
- [ ] Create initial cluster manually (manager, services, 1 worker)
- [ ] Configure Docker Swarm
- [ ] Set up Traefik with SSL
- [ ] Configure PostgreSQL and Redis
- [ ] Test deploying one n8n instance manually

### Week 2: Backend Services
- [ ] Create database migrations
- [ ] Implement HetznerService
- [ ] Implement SwarmService
- [ ] Implement DatabaseService
- [ ] Implement DNSService
- [ ] Implement main ProvisioningService
- [ ] Add email templates

### Week 3: Integration & Testing
- [ ] Integrate with subscription events
- [ ] Add admin endpoints for manual operations
- [ ] Write integration tests
- [ ] Test full flow: signup → payment → provisioning
- [ ] Test suspension and resumption
- [ ] Set up monitoring (Prometheus/Grafana)

---

## 🚨 Important Notes

1. **Security**: Store database passwords and encryption keys securely (consider HashiCorp Vault)
2. **Backup**: Set up automated backups for PostgreSQL databases
3. **Monitoring**: Implement Prometheus + Grafana for instance metrics
4. **Logging**: Centralize logs with Loki or similar
5. **Rate Limiting**: Limit provisioning to prevent abuse
6. **Retry Logic**: Implement queued jobs for resilient provisioning

---

Ready to start implementation? Begin with the infrastructure setup, then move to the backend services.
