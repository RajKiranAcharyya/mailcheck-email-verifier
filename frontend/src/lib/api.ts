const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export interface VerificationChecks {
  syntax: { valid: boolean; details?: string };
  disposable: { isDisposable: boolean };
  roleBased: { isRole: boolean; role?: string };
  mx: { hasMx: boolean; records: string[]; cached: boolean; cacheLevel?: 'memory' | 'database' | 'none' };
  freeProvider: { isFree: boolean };
}

export interface VerificationResult {
  email: string;
  user: string;
  domain: string;
  status: 'valid' | 'risky' | 'invalid';
  score: number;
  checks: VerificationChecks;
  suggestion: string | null;
  processedAt: string;
}

export interface JobProgress {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'interrupted';
  progress: number;
  total: number;
  processed: number;
  counts: {
    valid: number;
    risky: number;
    invalid: number;
  };
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobItem {
  id: number;
  email: string;
  status: 'valid' | 'risky' | 'invalid' | 'error' | 'pending';
  result?: VerificationResult | null;
  error?: string | null;
}

export interface JobItemsResponse {
  items: JobItem[];
  total: number;
  page: number;
  totalPages: number;
}

export async function verifySingleEmail(email: string): Promise<VerificationResult> {
  const res = await fetch(`${API_BASE}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Verification failed');
  }

  return json.data;
}

export async function uploadCsvJob(file: File): Promise<{ jobId: string; totalEmails: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/jobs/upload`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to upload CSV');
  }

  return json.data;
}

export async function getJobStatus(jobId: string): Promise<JobProgress> {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch job progress');
  }

  return json.data;
}

export async function getJobItems(
  jobId: string,
  page: number = 1,
  limit: number = 25,
  status?: string
): Promise<JobItemsResponse> {
  let url = `${API_BASE}/api/jobs/${jobId}/items?page=${page}&limit=${limit}`;
  if (status && status !== 'all') {
    url += `&status=${status}`;
  }

  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch job results');
  }

  return json.data;
}

export function getExportCsvUrl(jobId: string): string {
  return `${API_BASE}/api/jobs/${jobId}/export`;
}
