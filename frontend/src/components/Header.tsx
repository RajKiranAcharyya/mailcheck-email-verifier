import React from 'react';
import { ShieldCheck, ExternalLink, Database, Cpu } from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true'
    ? ''
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000');

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                MailCheck
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Two-Level Cached Email Verification & Hygiene Engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-sm">
          <a
            href={`${API_BASE}/api-docs`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium text-xs sm:text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>OpenAPI / Swagger</span>
          </a>

          <a
            href="https://github.com/RajKiranAcharyya/mailcheck-email-verifier"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm shadow-sm"
          >
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
