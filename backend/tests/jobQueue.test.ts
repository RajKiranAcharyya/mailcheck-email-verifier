import { db, runMigrations } from '../src/database/db';
import { JobService } from '../src/services/job.service';
import { VerificationService } from '../src/services/verification.service';
import { DnsService } from '../src/services/dns.service';

describe('Bulk Jobs and Concurrency Queue Tests', () => {
  let jobService: JobService;
  let verificationService: VerificationService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await runMigrations();

    const mockDns: Partial<DnsService> = {
      checkMx: jest.fn().mockResolvedValue({
        hasMx: true,
        records: ['mx.example.com'],
        cached: true,
        cacheLevel: 'memory',
      }),
    };
    verificationService = new VerificationService(mockDns as DnsService);
  });

  beforeEach(async () => {
    jobService = new JobService(verificationService, 3);
    await db('job_items').del();
    await db('jobs').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should create a bulk job and process items asynchronously', async () => {
    const emails = [
      'valid1@company.com',
      'valid2@company.com',
      'invalid-syntax',
      'admin@company.com',
    ];

    const job = await jobService.createJob(emails, 'leads.csv');
    expect(job.id).toBeDefined();
    expect(job.total_emails).toBe(4);
    expect(job.status).toBe('pending');

    // Wait for async processing
    await jobService.processJob(job.id);

    // Check completed status
    const fetched = await jobService.getJob(job.id);
    expect(fetched).toBeDefined();
    expect(fetched?.job.status).toBe('completed');
    expect(fetched?.job.processed_emails).toBe(4);
    expect(fetched?.items?.length).toBe(4);
  });

  it('should support pagination and status filtering on job items', async () => {
    const emails = ['user1@co.com', 'user2@co.com', 'bad1', 'bad2', 'admin@co.com'];
    const job = await jobService.createJob(emails);
    await jobService.processJob(job.id);

    // Page 1 with limit 2
    const page1 = await jobService.getJobItems(job.id, 1, 2);
    expect(page1.items.length).toBe(2);
    expect(page1.total).toBe(5);
    expect(page1.totalPages).toBe(3);

    // Filter by invalid status
    const invalidItems = await jobService.getJobItems(job.id, 1, 10, 'invalid');
    expect(invalidItems.items.length).toBeGreaterThanOrEqual(2);
    for (const item of invalidItems.items) {
      expect(item.status).toBe('invalid');
    }
  });

  it('should generate valid CSV export with header and verification fields', async () => {
    const emails = ['export1@co.com', 'export2@co.com'];
    const job = await jobService.createJob(emails, 'export_test.csv');
    await jobService.processJob(job.id);

    const csvString = await jobService.getJobExportData(job.id);
    const lines = csvString.trim().split('\n');

    expect(lines[0]).toContain('Email,Status,Score,Syntax Valid,Is Disposable,Is Role,Has MX,Suggestion');
    expect(lines.length).toBe(3); // header + 2 rows
    expect(lines[1]).toContain('export1@co.com');
  });
});
