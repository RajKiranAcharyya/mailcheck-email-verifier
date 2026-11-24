import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  Server,
  Layers,
  Database,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { verifySingleEmail, VerificationResult } from '../lib/api';
import { RiskGauge } from './RiskGauge';

export const SingleVerifyCard: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (emailToTest?: string) => {
    const target = emailToTest || email;
    if (!target.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await verifySingleEmail(target.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setEmail(suggestion);
    handleVerify(suggestion);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Single Email Verification</h2>
        <p className="text-sm text-slate-500 mb-6">
          Check syntax, disposable domains, role accounts, and MX records with two-level caching.
        </p>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.miller@company.com or test@gmial.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Verify Email</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Typo suggestion banner */}
        {result?.suggestion && (
          <div className="p-4 mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>
                Did you mean <strong className="underline">{result.suggestion}</strong>?
              </span>
            </div>
            <button
              onClick={() => applySuggestion(result.suggestion!)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <span>Apply Fix</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Verification Result Breakdown */}
        {result && (
          <div className="space-y-6 pt-2 border-t border-slate-100">
            {/* Risk Gauge */}
            <RiskGauge score={result.score} status={result.status} />

            {/* Checklist items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Syntax */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start space-x-3">
                {result.checks.syntax.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-800">Syntax Format</div>
                  <div className="text-xs text-slate-500">
                    {result.checks.syntax.valid
                      ? 'Compliant with RFC 5322 specification'
                      : result.checks.syntax.details || 'Malformed address'}
                  </div>
                </div>
              </div>

              {/* Disposable */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start space-x-3">
                {!result.checks.disposable.isDisposable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-800">Disposable Mailbox</div>
                  <div className="text-xs text-slate-500">
                    {result.checks.disposable.isDisposable
                      ? 'Detected temporary / burner email provider'
                      : 'Not a recognized disposable service (57k+ list)'}
                  </div>
                </div>
              </div>

              {/* Role-based */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start space-x-3">
                {!result.checks.roleBased.isRole ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-800">Role-Based Account</div>
                  <div className="text-xs text-slate-500">
                    {result.checks.roleBased.isRole
                      ? `Generic departmental mailbox (${result.checks.roleBased.role})`
                      : 'Personal or individual mailbox identifier'}
                  </div>
                </div>
              </div>

              {/* MX Record & Two-Level Cache */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start space-x-3">
                {result.checks.mx.hasMx ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">MX Records</span>
                    {result.checks.mx.cached && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        {result.checks.mx.cacheLevel === 'memory' ? (
                          <>
                            <Zap className="w-3 h-3 text-blue-600" />
                            <span>Memory Cache (L1)</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-3 h-3 text-blue-600" />
                            <span>SQLite Cache (L2)</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {result.checks.mx.hasMx
                      ? `${result.checks.mx.records.length} mail exchange server(s) active`
                      : 'No mail exchange records configured for domain'}
                  </div>
                  {result.checks.mx.records.length > 0 && (
                    <div className="mt-2 text-[11px] font-mono bg-white p-2 rounded border border-slate-200 text-slate-600 truncate max-w-full">
                      {result.checks.mx.records.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
