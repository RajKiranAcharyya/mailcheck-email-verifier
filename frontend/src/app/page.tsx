'use client';

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { SingleVerifyCard } from '../components/SingleVerifyCard';
import { BulkVerifyCard } from '../components/BulkVerifyCard';
import { Mail, Files, Zap, Shield, Database, CheckSquare } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  const downloadSampleCsv = () => {
    const sampleCsv = `email,name
alex.turner@gmail.com,Alex Turner
support@github.com,GitHub Support
burner.test@mailinator.com,Test Mailinator
invalid-email-address,Invalid User
sarah@outlok.com,Sarah (Typo)
billing@company.org,Billing Team`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Production-Grade Email Hygiene & Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Verify Deliverability with Two-Level Caching
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminate bounces and spam traps. Checks syntax, disposable mailboxes, role accounts, and DNS MX records with sub-millisecond cached lookups.
          </p>

          {/* Feature Highlights Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="flex items-center space-x-1 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Two-Level Domain Cache (24h TTL)</span>
            </span>
            <span className="flex items-center space-x-1 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
              <Database className="w-3 h-3 text-blue-500" />
              <span>57,000+ Disposable Domains</span>
            </span>
            <span className="flex items-center space-x-1 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
              <CheckSquare className="w-3 h-3 text-emerald-500" />
              <span>Startup Crash Recovery</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'single'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Single Email Check</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'bulk'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Files className="w-4 h-4" />
              <span>Bulk CSV Verification</span>
            </button>
          </div>

          {activeTab === 'bulk' && (
            <button
              onClick={downloadSampleCsv}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline hidden sm:block"
            >
              Download Sample CSV
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'single' ? <SingleVerifyCard /> : <BulkVerifyCard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Built with <strong>Next.js, TypeScript, Express, SQLite & Knex</strong>
          </div>
          <div>
            Backed by 52 passing Jest tests • Rate Limited • Swagger Documented
          </div>
        </div>
      </footer>
    </div>
  );
}
