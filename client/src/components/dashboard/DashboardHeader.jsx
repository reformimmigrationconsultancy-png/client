import React from 'react';
import { format } from 'date-fns';
import { PlusIcon } from '@heroicons/react/24/solid';

export default function DashboardHeader({ user, onComposeClick }) {
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 mb-8">
      <div>
        <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight leading-tight">
          Dashboard Overview
        </h1>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-600">Live Sync</span>
          </div>
          <span className="text-[13px] font-semibold text-slate-500">{currentDate}</span>
        </div>

        <button 
          onClick={onComposeClick}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:bg-indigo-500 hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition-all duration-200 hover:-translate-y-[1px]"
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
          Add Lead
        </button>
      </div>
    </div>
  );
}
