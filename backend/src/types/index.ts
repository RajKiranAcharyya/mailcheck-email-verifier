export type EmailStatus = 'valid' | 'risky' | 'invalid';

export interface VerificationChecks {
  syntax: {
    valid: boolean;
    details?: string;
  };
  disposable: {
    isDisposable: boolean;
  };
  roleBased: {
    isRole: boolean;
    role?: string;
  };
  mx: {
    hasMx: boolean;
    records: string[];
    cached: boolean;
    cacheLevel?: 'memory' | 'database' | 'none';
  };
  freeProvider: {
    isFree: boolean;
  };
}

export interface VerificationResult {
  email: string;
  user: string;
  domain: string;
  status: EmailStatus;
  score: number; // 0 (safest) to 100 (riskiest / invalid)
  checks: VerificationChecks;
  suggestion: string | null;
  processedAt: string;
}

export interface DomainCacheEntry {
  domain: string;
  hasMx: boolean;
  mxRecords: string[];
  expiresAt: number; // ms timestamp
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'interrupted';

export interface JobRecord {
  id: string;
  filename?: string | null;
  status: JobStatus;
  total_emails: number;
  processed_emails: number;
  valid_count: number;
  risky_count: number;
  invalid_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobItemRecord {
  id?: number;
  job_id: string;
  email: string;
  status: 'pending' | 'valid' | 'risky' | 'invalid' | 'error';
  result?: string | null; // JSON string of VerificationResult
  error?: string | null;
  created_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
