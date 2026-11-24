import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import { jobService } from '../services/job.service';

export class JobController {
  /**
   * Upload CSV file for asynchronous bulk email verification.
   */
  async uploadCsv(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_MISSING',
            message: 'No CSV file uploaded. Please upload a CSV file with an email column.',
          },
        });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      let records: string[][];
      try {
        records = parse(csvContent, {
          skip_empty_lines: true,
          relax_column_count: true,
          trim: true,
        });
      } catch (err: any) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CSV_PARSE_ERROR',
            message: `Failed to parse CSV file: ${err.message}`,
          },
        });
      }

      if (records.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMPTY_CSV',
            message: 'Uploaded CSV file contains no data rows.',
          },
        });
      }

      // Determine email column index
      const headerRow = records[0];
      let emailColIndex = -1;

      // Check header row for common names
      for (let i = 0; i < headerRow.length; i++) {
        const h = headerRow[i].toLowerCase();
        if (h.includes('email') || h.includes('e-mail') || h === 'mail' || h === 'address') {
          emailColIndex = i;
          break;
        }
      }

      let dataRows = records;
      if (emailColIndex !== -1) {
        // First row is header
        dataRows = records.slice(1);
      } else {
        // Search first data row for cell containing '@'
        for (let i = 0; i < headerRow.length; i++) {
          if (headerRow[i].includes('@')) {
            emailColIndex = i;
            break;
          }
        }
        if (emailColIndex === -1) {
          // Default to first column
          emailColIndex = 0;
        }
      }

      const emails: string[] = [];
      for (const row of dataRows) {
        if (row[emailColIndex]) {
          const val = row[emailColIndex].trim();
          if (val && (val.includes('@') || emailColIndex === 0)) {
            emails.push(val);
          }
        }
      }

      if (emails.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_VALID_EMAILS_FOUND',
            message: 'Could not detect any email addresses in the uploaded CSV file.',
          },
        });
      }

      const job = await jobService.createJob(emails, req.file.originalname);

      return res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          filename: job.filename,
          status: job.status,
          totalEmails: job.total_emails,
          message: 'Bulk verification job created successfully and processing in background.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create bulk job directly via JSON array of emails.
   */
  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { emails, filename } = req.body;
      const job = await jobService.createJob(emails, filename);

      return res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          filename: job.filename,
          status: job.status,
          totalEmails: job.total_emails,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Polling endpoint to check progress of bulk job.
   */
  async getJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const jobData = await jobService.getJob(id);

      if (!jobData) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Job with ID '${id}' was not found.`,
          },
        });
      }

      const job = jobData.job;
      const progressPercent =
        job.total_emails > 0 ? Math.round((job.processed_emails / job.total_emails) * 100) : 100;

      return res.status(200).json({
        success: true,
        data: {
          id: job.id,
          filename: job.filename,
          status: job.status,
          progress: progressPercent,
          total: job.total_emails,
          processed: job.processed_emails,
          counts: {
            valid: job.valid_count,
            risky: job.risky_count,
            invalid: job.invalid_count,
          },
          errorMessage: job.error_message,
          createdAt: job.created_at,
          updatedAt: job.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves paginated results of a job.
   */
  async getJobItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const status = req.query.status as string;

      const result = await jobService.getJobItems(id, page, limit, status);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export verified emails as CSV.
   */
  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const jobData = await jobService.getJob(id);

      if (!jobData) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: `Job with ID '${id}' was not found.`,
          },
        });
      }

      const csvData = await jobService.getJobExportData(id);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="verified-emails-${id}.csv"`);
      return res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }
}

export const jobController = new JobController();
