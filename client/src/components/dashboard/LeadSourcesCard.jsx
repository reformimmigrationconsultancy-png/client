import React from 'react';

const SOURCE_COLORS = {
  facebook: { label: 'Meta Ads', color: 'bg-indigo-500' },
  instagram: { label: 'Instagram Ads', color: 'bg-pink-500' },
  google: { label: 'Google Ads', color: 'bg-rose-500' },
  website: { label: 'Website Form', color: 'bg-emerald-500' },
  manual: { label: 'Manual Direct', color: 'bg-slate-700' }
};

export default function LeadSourcesCard({ bySource = [] }) {
  const total = bySource.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;

  const data = bySource.map(s => {
    const key = (s._id || 'manual').toLowerCase();
    const config = SOURCE_COLORS[key] || {
      label: s._id ? (s._id.charAt(0).toUpperCase() + s._id.slice(1)) : 'Direct/Other',
      color: 'bg-slate-400'
    };
    return {
      name: config.label,
      value: s.count || 0,
      color: config.color,
      percentage: Math.round(((s.count || 0) / total) * 100)
    };
  }).sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">
          Acquisition
        </h3>
        <span className="text-[13px] font-semibold text-slate-900">
          {total} <span className="text-slate-400 font-medium">Total</span>
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[13px] text-slate-400 font-medium py-8">
            No source data available
          </div>
        ) : (
          <div className="space-y-5">
            {data.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[13px] leading-none">
                  <span className="font-semibold text-slate-700">{entry.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{entry.value}</span>
                    <span className="text-slate-400 font-medium w-9 text-right">{entry.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${entry.color} rounded-full`}
                    style={{ width: `${entry.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
