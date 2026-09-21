import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PulseSync SaaS database with realistic production data...');

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.incidentUpdate.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.workspace.deleteMany({});

  // 1. Create Demo Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Cloud Operations',
      slug: 'acme-cloud-ops',
      plan: 'ENTERPRISE',
    },
  });
  console.log(`✅ Created Workspace: ${workspace.name} (${workspace.id})`);

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('PulseDemo2026!', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'alex@pulsesync.io',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      workspaceId: workspace.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah@pulsesync.io',
      passwordHash,
      role: 'MANAGER',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      workspaceId: workspace.id,
    },
  });

  const engineer = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'marcus@pulsesync.io',
      passwordHash,
      role: 'MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      workspaceId: workspace.id,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena@pulsesync.io',
      passwordHash,
      role: 'VIEWER',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      workspaceId: workspace.id,
    },
  });
  console.log('✅ Created 4 users across ADMIN, MANAGER, MEMBER, and VIEWER roles');

  // 3. Create Sample Incidents
  const inc1 = await prisma.incident.create({
    data: {
      title: 'Payment Gateway Stripe Webhook Timeout',
      description: 'Checkout webhooks failing with HTTP 504. Inbound requests to /webhooks/stripe experiencing elevated latency > 5000ms.',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      serviceName: 'Payment Service',
      workspaceId: workspace.id,
      creatorId: admin.id,
      assigneeId: engineer.id,
      updates: {
        create: [
          {
            authorId: admin.id,
            status: 'INVESTIGATING',
            message: 'Incident detected via Datadog anomaly monitor. On-call engineer Marcus Vance paged.',
          },
          {
            authorId: engineer.id,
            status: 'INVESTIGATING',
            message: 'Investigating Redis connection pool exhaustion on payment-worker pods.',
          },
        ],
      },
    },
  });

  const inc2 = await prisma.incident.create({
    data: {
      title: 'Auth Service Token Invalidation Spike',
      description: 'Users reporting unexpected logout prompts upon navigating across micro-frontend boundaries.',
      severity: 'HIGH',
      status: 'IDENTIFIED',
      serviceName: 'Auth Service',
      workspaceId: workspace.id,
      creatorId: manager.id,
      assigneeId: admin.id,
      updates: {
        create: [
          {
            authorId: manager.id,
            status: 'INVESTIGATING',
            message: 'Issue reported from enterprise customer Slack channels.',
          },
          {
            authorId: admin.id,
            status: 'IDENTIFIED',
            message: 'Identified root cause: JWT rotation timestamp desync between US-East and EU-West clusters.',
          },
        ],
      },
    },
  });

  const inc3 = await prisma.incident.create({
    data: {
      title: 'Database Read Replica Lag > 120s',
      description: 'Replica lag on read-cluster-02 exceeded SLO threshold. Analytics queries delayed.',
      severity: 'MEDIUM',
      status: 'MONITORING',
      serviceName: 'PostgreSQL Cluster',
      workspaceId: workspace.id,
      creatorId: engineer.id,
      assigneeId: engineer.id,
      updates: {
        create: [
          {
            authorId: engineer.id,
            status: 'MONITORING',
            message: 'Applied indexing fix on large batch query. Replication lag dropping back under 100ms.',
          },
        ],
      },
    },
  });

  const inc4 = await prisma.incident.create({
    data: {
      title: 'CloudFront CDN Edge Cache Poisoning Warning',
      description: 'Spike in cache hit misses for static bundle chunk hashes.',
      severity: 'LOW',
      status: 'RESOLVED',
      serviceName: 'CDN & Edge',
      workspaceId: workspace.id,
      creatorId: manager.id,
      assigneeId: admin.id,
      resolvedAt: new Date(Date.now() - 3600 * 1000 * 4), // 4 hours ago
      updates: {
        create: [
          {
            authorId: manager.id,
            status: 'INVESTIGATING',
            message: 'Cache miss alerts triggered by CloudWatch.',
          },
          {
            authorId: admin.id,
            status: 'RESOLVED',
            message: 'Invalidated CDN edge distributions and redeployed static assets.',
          },
        ],
      },
    },
  });

  console.log('✅ Created 4 sample incidents across different severity levels');

  // 4. Create API Keys
  const demoApiKeyRaw = 'psk_live_demo1234567890abcdef12345678';
  const demoApiKeyHash = crypto.createHash('sha256').update(demoApiKeyRaw).digest('hex');

  await prisma.apiKey.create({
    data: {
      name: 'CI/CD Pipeline Key',
      prefix: 'psk_live_demo12...',
      keyHash: demoApiKeyHash,
      workspaceId: workspace.id,
      creatorId: admin.id,
    },
  });
  console.log(`✅ Created Demo API Key: ${demoApiKeyRaw}`);

  // 5. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: admin.id,
        action: 'WORKSPACE_CREATED',
        entityType: 'WORKSPACE',
        entityId: workspace.id,
        details: 'Initial workspace created with ENTERPRISE plan',
      },
      {
        workspaceId: workspace.id,
        userId: admin.id,
        action: 'INCIDENT_CREATED',
        entityType: 'INCIDENT',
        entityId: inc1.id,
        details: 'Incident paged: Payment Gateway Stripe Webhook Timeout',
      },
      {
        workspaceId: workspace.id,
        userId: engineer.id,
        action: 'INCIDENT_UPDATED',
        entityType: 'INCIDENT',
        entityId: inc3.id,
        details: 'Status updated to MONITORING',
      },
    ],
  });
  console.log('✅ Created initial audit logs');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
