import { db, runMigrations } from '../src/database/db';
import { JobService } from '../src/services/job.service';

describe('Startup Recovery Tests for Interrupted Jobs', () => {
  let jobService: JobService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await runMigrations();
  });

  beforeEach(async () => {
    jobService = new JobService();
    await db('job_items').del();
    await db('jobs').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should recover and mark pending or processing jobs as interrupted upon server restart', async () => {
    const now = new Date().toISOString();

    // Simulate jobs left pending or processing prior to restart
    await db('jobs').insert([
      {
        id: 'job-pending-1',
        filename: 'pending.csv',
        status: 'pending',
        total_emails: 100,
        processed_emails: 0,
        valid_count: 0,
        risky_count: 0,
        invalid_count: 0,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'job-processing-2',
        filename: 'interrupted-midway.csv',
        status: 'processing',
        total_emails: 50,
        processed_emails: 25,
        valid_count: 20,
        risky_count: 5,
        invalid_count: 0,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'job-completed-3',
        filename: 'finished.csv',
        status: 'completed',
        total_emails: 10,
        processed_emails: 10,
        valid_count: 10,
        risky_count: 0,
        invalid_count: 0,
        created_at: now,
        updated_at: now,
      },
    ]);

    // Execute startup recovery
    const recovered = await jobService.recoverInterruptedJobs();
    expect(recovered).toBe(2);

    // Verify status and error_message of interrupted jobs
    const job1 = await db('jobs').where({ id: 'job-pending-1' }).first();
    expect(job1.status).toBe('interrupted');
    expect(job1.error_message).toBe('Job interrupted by server restart');

    const job2 = await db('jobs').where({ id: 'job-processing-2' }).first();
    expect(job2.status).toBe('interrupted');
    expect(job2.error_message).toBe('Job interrupted by server restart');

    // Verify completed job was preserved untouched
    const job3 = await db('jobs').where({ id: 'job-completed-3' }).first();
    expect(job3.status).toBe('completed');
    expect(job3.error_message).toBeNull();
  });

  it('should report 0 when clean restart with no pending or processing jobs', async () => {
    const recovered = await jobService.recoverInterruptedJobs();
    expect(recovered).toBe(0);
  });
});
