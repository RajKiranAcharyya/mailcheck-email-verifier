'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
  Download,
} from 'lucide-react';
import { uploadCsvJob, getJobStatus, JobProgress } from '../lib/api';

// Code-split the heavy paginated results table per resume requirement
const PaginatedResultsTable = dynamic(
  () => import('./PaginatedResultsTable'),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-sm text-slate-400 bg-white rounded-xl border border-slate-200">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-500" />
        <span>Loading paginated results table...</span>
      </div>
    ),
  }
);

export const BulkVerifyCard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeJob, setActiveJob] = useState<JobProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll job status until completed or failed
  useEffect(() => {
    if (!activeJob?.id) return;
    if (activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'interrupted') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await getJobStatus(activeJob.id);
        setActiveJob(updated);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith('.csv')) {
        setFile(dropped);
        setError(null);
      } else {
        setError('Please drop a valid .csv file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const res = await uploadCsvJob(file);
      // Fetch initial job status
      const initialJob = await getJobStatus(res.jobId);
      setActiveJob(initialJob);
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Bulk CSV Verification</h2>
            <p className="text-sm text-slate-500">
              Asynchronous worker pool processing with limited concurrency and progress polling.
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
            Concurrency: 5 workers
          </span>
        </div>

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
                setError(null);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {file ? file.name : 'Click to select or drag and drop your CSV file'}
            </div>
            <p className="text-xs text-slate-400">
              Auto-detects columns named &apos;email&apos;, &apos;e-mail&apos;, or parses addresses
            </p>
          </div>
        </div>

        {/* Upload Action Button */}
        {file && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Job...</span>
                </>
              ) : (
                <span>Start Verification Job</span>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Job Progress and Statistics */}
        {activeJob && (
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Job Status
                </span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-base font-bold text-slate-900 capitalize">
                    {activeJob.status}
                  </span>
                  {activeJob.status === 'processing' && (
                    <span className="flex items-center text-xs text-blue-600 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      Processing in background
                    </span>
                  )}
                  {activeJob.status === 'completed' && (
                    <span className="flex items-center text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      All emails verified
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{activeJob.progress}%</span>
                <div className="text-xs text-slate-500">
                  {activeJob.processed} of {activeJob.total} processed
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, activeJob.progress)}%` }}
              />
            </div>

            {/* Summary Counters */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Valid</span>
                </div>
                <div className="text-2xl font-bold">{activeJob.counts.valid}</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                <div className="flex items-center space-x-1.5 text-xs text-amber-700 font-semibold mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Risky</span>
                </div>
                <div className="text-2xl font-bold">{activeJob.counts.risky}</div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                <div className="flex items-center space-x-1.5 text-xs text-rose-700 font-semibold mb-1">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Invalid</span>
                </div>
                <div className="text-2xl font-bold">{activeJob.counts.invalid}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Code-split Paginated Results Table */}
      {activeJob && <PaginatedResultsTable jobId={activeJob.id} />}
    </div>
  );
};
