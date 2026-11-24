import { v4 as uuidv4 } from 'uuid';
import pLimit from 'p-limit';
import { db } from '../database/db';
import { verificationService, VerificationService } from './verification.service';
import { JobRecord, JobItemRecord, VerificationResult } from '../types';

export class JobService {
  private verification: VerificationService;
  private concurrency: number;

  constructor(
    verification: VerificationService = verificationService,
    concurrency: number = parseInt(process.env.JOB_CONCURRENCY || '5', 10)
  ) {
    this.verification = verification;
    this.concurrency = concurrency;
  }

  /**
   * Startup recovery: scans for jobs that were interrupted by a server shutdown/restart
   * and marks them as interrupted / failed.
   */
  async recoverInterruptedJobs(): Promise<number> {
    const updatedCount = await db('jobs')
      .whereIn('status', ['pending', 'processing'])
      .update({
        status: 'interrupted',
        error_message: 'Job interrupted by server restart',
        updated_at: new Date().toISOString(),
      });

    return updatedCount;
  }

  /**
   * Creates a new bulk job and inserts pending items.
   */
  async createJob(emails: string[], filename?: string): Promise<JobRecord> {
    const jobId = uuidv4();
    const now = new Date().toISOString();

    // Deduplicate or clean emails
    const cleanEmails = emails.map((e) => e.trim()).filter((e) => e.length > 0);

    const jobPayload: JobRecord = {
      id: jobId,
      filename: filename || 'bulk_upload.csv',
      status: 'pending',
      total_emails: cleanEmails.length,
      processed_emails: 0,
      valid_count: 0,
      risky_count: 0,
      invalid_count: 0,
      error_message: null,
      created_at: now,
      updated_at: now,
    };

    await db('jobs').insert(jobPayload);

    if (cleanEmails.length > 0) {
      // Chunk insert into job_items (500 items per chunk for SQLite limit)
      const chunkSize = 500;
      for (let i = 0; i < cleanEmails.length; i += chunkSize) {
        const chunk = cleanEmails.slice(i, i + chunkSize).map((email) => ({
          job_id: jobId,
          email,
          status: 'pending',
          result: null,
          error: null,
          created_at: now,
        }));
        await db('job_items').insert(chunk);
      }
    }

    // Trigger async processing in background
    setImmediate(() => {
      this.processJob(jobId).catch((err) => {
        console.error(`Background job ${jobId} failed:`, err);
      });
    });

    return jobPayload;
  }

  /**
   * Processes a job asynchronously with controlled concurrency.
   */
  async processJob(jobId: string): Promise<void> {
    const job = await db('jobs').where({ id: jobId }).first();
    if (!job || job.status === 'interrupted' || job.status === 'completed') {
      return;
    }

    await db('jobs').where({ id: jobId }).update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    });

    const items = await db('job_items').where({ job_id: jobId, status: 'pending' });
    const limit = pLimit(this.concurrency);

    let processed = 0;
    let validCount = 0;
    let riskyCount = 0;
    let invalidCount = 0;

    const tasks = items.map((item: JobItemRecord) =>
      limit(async () => {
        try {
          const result = await this.verification.verify(item.email);
          let itemStatus: 'valid' | 'risky' | 'invalid' = result.status;

          if (result.status === 'valid') validCount++;
          else if (result.status === 'risky') riskyCount++;
          else invalidCount++;

          processed++;

          await db('job_items')
            .where({ id: item.id })
            .update({
              status: itemStatus,
              result: JSON.stringify(result),
            });

          // Update job progress periodically
          if (processed % 5 === 0 || processed === items.length) {
            await db('jobs')
              .where({ id: jobId })
              .update({
                processed_emails: processed,
                valid_count: validCount,
                risky_count: riskyCount,
                invalid_count: invalidCount,
                updated_at: new Date().toISOString(),
              });
          }
        } catch (err: any) {
          processed++;
          invalidCount++;
          await db('job_items')
            .where({ id: item.id })
            .update({
              status: 'error',
              error: err.message || 'Unknown processing error',
            });
        }
      })
    );

    await Promise.all(tasks);

    // Final update
    await db('jobs')
      .where({ id: jobId })
      .update({
        status: 'completed',
        processed_emails: processed,
        valid_count: validCount,
        risky_count: riskyCount,
        invalid_count: invalidCount,
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Retrieves job status and progress.
   */
  async getJob(jobId: string): Promise<{ job: JobRecord; items?: any[] } | null> {
    const job = await db('jobs').where({ id: jobId }).first();
    if (!job) return null;

    const items = await db('job_items').where({ job_id: jobId });
    const parsedItems = items.map((it: any) => ({
      id: it.id,
      email: it.email,
      status: it.status,
      result: it.result ? JSON.parse(it.result) : null,
      error: it.error,
    }));

    return { job, items: parsedItems };
  }

  /**
   * Retrieves paginated job results.
   */
  async getJobItems(
    jobId: string,
    page: number = 1,
    limit: number = 50,
    filterStatus?: string
  ): Promise<{ items: any[]; total: number; page: number; totalPages: number }> {
    let query = db('job_items').where({ job_id: jobId });

    if (filterStatus && ['valid', 'risky', 'invalid', 'error'].includes(filterStatus)) {
      query = query.where({ status: filterStatus });
    }

    const totalRes = await query.clone().count('id as count').first();
    const total = Number(totalRes?.count || 0);

    const offset = (page - 1) * limit;
    const items = await query.clone().limit(limit).offset(offset).orderBy('id', 'asc');

    const parsedItems = items.map((it: any) => ({
      id: it.id,
      email: it.email,
      status: it.status,
      result: it.result ? JSON.parse(it.result) : null,
      error: it.error,
    }));

    return {
      items: parsedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Generates CSV export data for a completed job.
   */
  async getJobExportData(jobId: string): Promise<string> {
    const items = await db('job_items').where({ job_id: jobId }).orderBy('id', 'asc');

    const header = [
      'Email',
      'Status',
      'Score',
      'Syntax Valid',
      'Is Disposable',
      'Is Role',
      'Has MX',
      'Suggestion',
    ].join(',');

    const rows = items.map((it: any) => {
      const res: VerificationResult | null = it.result ? JSON.parse(it.result) : null;
      return [
        `"${it.email}"`,
        `"${it.status}"`,
        res ? res.score : 'N/A',
        res ? res.checks.syntax.valid : 'N/A',
        res ? res.checks.disposable.isDisposable : 'N/A',
        res ? res.checks.roleBased.isRole : 'N/A',
        res ? res.checks.mx.hasMx : 'N/A',
        res?.suggestion ? `"${res.suggestion}"` : '""',
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }
}

export const jobService = new JobService();
