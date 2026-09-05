import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function NeedsAttentionCard({ stats }) {
  const navigate = useNavigate();

  const openConvsCount = stats?.openConversations || 0;
  const docsPendingCount = stats?.pipeline?.documents_received || stats?.pipeline?.docsReceived || 0;

  const items = [];

  if (openConvsCount > 0) {
    items.push({
      id: 'convs',
      text: `${openConvsCount} emails waiting for reply`,
      action: 'View conversations',
      color: 'text-amber-600',
      dot: 'bg-amber-500'
    });
  }

  if (docsPendingCount > 0) {
    items.push({
      id: 'docs',
      text: `${docsPendingCount} documents pending review`,
      action: 'Review documents',
      color: 'text-indigo-600',
      dot: 'bg-indigo-500'
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Needs Attention
        </h3>
        {items.length > 0 && (
          <span className="text-[11px] font-semibold text-slate-500">
            {items.length} require action
          </span>
        )}
      </div>

      <div className="p-4 flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <CheckCircleIcon className="w-10 h-10 text-emerald-400 mb-3" />
            <p className="text-[14px] font-semibold text-slate-900">You're all caught up</p>
            <p className="text-[13px] text-slate-500 mt-1">No follow-ups or replies need your attention.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/leads')}
                className="flex flex-col gap-1.5 p-4 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
              >
                <div className="flex items-start gap-3.5">
                  <span className={`w-2 h-2 rounded-full ${item.dot} mt-1.5 shrink-0 shadow-sm`} />
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900 leading-snug">
                      {item.text}
                    </p>
                    <div className={`mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold ${item.color} group-hover:underline`}>
                      {item.action}
                      <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
