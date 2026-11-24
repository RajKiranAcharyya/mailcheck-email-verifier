import request from 'supertest';
import { createApp } from '../src/app';
import { db, runMigrations } from '../src/database/db';
import { dnsService } from '../src/services/dns.service';

describe('MailCheck REST API Endpoints Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await runMigrations();

    // Mock DNS lookup so test suite does not require external network
    jest.spyOn(dnsService, 'lookupMxDns').mockImplementation(async (domain: string) => {
      if (domain === 'invalid-dns.xyz') {
        return { hasMx: false, records: [] };
      }
      return { hasMx: true, records: [`mx.${domain}`] };
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('GET /health should return 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('mailcheck-backend');
  });

  it('POST /api/verify should verify valid email and return structured response', async () => {
    const res = await request(app)
      .post('/api/verify')
      .send({ email: 'developer@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('developer@example.com');
    expect(res.body.data.status).toBeDefined();
    expect(res.body.data.score).toBeDefined();
    expect(res.body.data.checks.syntax.valid).toBe(true);
    expect(res.body.data.checks.mx.hasMx).toBe(true);
  });

  it('POST /api/verify should return structured validation error when body is invalid', async () => {
    const res = await request(app).post('/api/verify').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('GET /api/verify should support verification via query parameter', async () => {
    const res = await request(app).get('/api/verify?email=test@example.com');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.domain).toBe('example.com');
  });

  it('POST /api/verify/batch should verify synchronous batch of emails', async () => {
    const res = await request(app)
      .post('/api/verify/batch')
      .send({ emails: ['a@example.com', 'b@example.com'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.results.length).toBe(2);
  });

  it('POST /api/jobs should create an asynchronous bulk job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({ emails: ['alpha@co.com', 'beta@co.com', 'bad_email'] });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBeDefined();
    expect(res.body.data.totalEmails).toBe(3);
  });

  it('POST /api/jobs/upload should accept multipart CSV file and create job', async () => {
    const csvContent = 'email,name\nuser1@test.com,User One\nuser2@test.com,User Two\n';

    const res = await request(app)
      .post('/api/jobs/upload')
      .attach('file', Buffer.from(csvContent), 'test_leads.csv');

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBeDefined();
    expect(res.body.data.totalEmails).toBe(2);
  });

  it('GET /api/jobs/:id should return job progress polled by UI', async () => {
    // Create job first
    const createRes = await request(app)
      .post('/api/jobs')
      .send({ emails: ['poll1@test.com'] });

    const jobId = createRes.body.data.jobId;

    const res = await request(app).get(`/api/jobs/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(jobId);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.status).toBeDefined();
  });

  it('GET /api/jobs/:id/export should export verified results as CSV', async () => {
    const createRes = await request(app)
      .post('/api/jobs')
      .send({ emails: ['export_test@co.com'] });

    const jobId = createRes.body.data.jobId;

    const res = await request(app).get(`/api/jobs/${jobId}/export`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(`verified-emails-${jobId}.csv`);
    expect(res.text).toContain('export_test@co.com');
  });

  it('GET /api-docs should render Swagger UI', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });

  it('Unknown routes should return structured 404 error', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
