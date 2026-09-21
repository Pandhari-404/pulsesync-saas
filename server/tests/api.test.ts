import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config';

const app = createApp();

describe('PulseSync SaaS End-to-End API Test Suite', () => {
  let authToken: string;
  let workspaceId: string;
  let createdIncidentId: string;
  let testApiKey: string;

  beforeAll(async () => {
    // Ensure DB connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Health & Observability Endpoints', () => {
    it('GET /health/live should return 200 OK UP status', async () => {
      const res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    it('GET /health/ready should return 200 OK READY status', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('READY');
      expect(res.body.services.database).toBe('HEALTHY');
    });

    it('GET /health/telemetry should return system stats', async () => {
      const res = await request(app).get('/health/telemetry');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('HEALTHY');
      expect(res.body.process).toBeDefined();
      expect(res.body.system).toBeDefined();
    });

    it('GET /health/metrics should expose Prometheus metrics', async () => {
      const res = await request(app).get('/health/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('pulsesync_http_requests_total');
    });
  });

  describe('2. Authentication & Authorization Flow', () => {
    const uniqueEmail = `test.sre.${Date.now()}@pulsesync.io`;

    it('POST /api/auth/register should create user, workspace, and issue JWT', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test SRE Engineer',
        email: uniqueEmail,
        password: 'Password123!',
        workspaceName: 'Test Operations Cloud',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(uniqueEmail);
      expect(res.body.data.workspace.name).toBe('Test Operations Cloud');

      authToken = res.body.data.token;
      workspaceId = res.body.data.workspace.id;
    });

    it('POST /api/auth/register should reject duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Engineer',
        email: uniqueEmail,
        password: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login should authenticate valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: uniqueEmail,
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('POST /api/auth/login should reject incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: uniqueEmail,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(uniqueEmail);
      expect(res.body.data.role).toBe('ADMIN');
    });

    it('GET /api/auth/demo should provide 1-click test credentials', async () => {
      const res = await request(app).get('/api/auth/demo');
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('3. Incidents Lifecycle & Real-Time Sync', () => {
    it('POST /api/incidents should create an incident', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Automated Test: API Latency Spike on US-East',
          description: 'P99 latency elevated to 1450ms across public edge proxy nodes.',
          severity: 'HIGH',
          serviceName: 'Core API',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Automated Test: API Latency Spike on US-East');
      expect(res.body.data.status).toBe('INVESTIGATING');

      createdIncidentId = res.body.data.id;
    });

    it('GET /api/incidents should list incidents for current workspace', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/incidents/:id should retrieve detailed incident', async () => {
      const res = await request(app)
        .get(`/api/incidents/${createdIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdIncidentId);
    });

    it('PUT /api/incidents/:id should update status to IDENTIFIED', async () => {
      const res = await request(app)
        .put(`/api/incidents/${createdIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'IDENTIFIED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IDENTIFIED');
    });

    it('POST /api/incidents/:id/comments should add communication entry', async () => {
      const res = await request(app)
        .post(`/api/incidents/${createdIncidentId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'MONITORING',
          message: 'Rolled back bad deployment. Traffic returning to baseline.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.message).toContain('Rolled back');
    });
  });

  describe('4. Analytics & Telemetry Engine', () => {
    it('GET /api/analytics/dashboard should return computed SaaS metrics', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.trends).toBeDefined();
      expect(res.body.data.statusCounts).toBeDefined();
    });
  });

  describe('5. API Keys & Programmatic Access', () => {
    it('POST /api/keys should generate a new API key', async () => {
      const res = await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Terraform Automator',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.apiKey).toBeDefined();
      expect(res.body.data.apiKey.startsWith('psk_live_')).toBe(true);

      testApiKey = res.body.data.apiKey;
    });

    it('GET /api/incidents should authenticate via X-API-Key header', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('X-API-Key', testApiKey);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
