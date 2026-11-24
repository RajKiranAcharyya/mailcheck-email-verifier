import React from 'react';

interface RiskGaugeProps {
  score: number;
  status: 'valid' | 'risky' | 'invalid';
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, status }) => {
  // Config by status
  const config = {
    valid: {
      color: 'text-emerald-600',
      barColor: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      label: 'Deliverable (Low Risk)',
    },
    risky: {
      color: 'text-amber-600',
      barColor: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      label: 'Caution (Risky)',
    },
    invalid: {
      color: 'text-rose-600',
      barColor: 'bg-rose-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      label: 'Undeliverable (High Risk)',
    },
  }[status];

  return (
    <div className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Risk Score
        </span>
        <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
      </div>

      <div className="flex items-baseline space-x-2 mb-2">
        <span className={`text-3xl font-extrabold ${config.color}`}>{score}</span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${config.barColor}`}
          style={{ width: `${Math.max(4, score)}%` }}
        />
      </div>
    </div>
  );
};
