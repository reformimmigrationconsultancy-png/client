import React from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

export default function DashboardHeader({ user, onComposeClick }) {
  return (
    <div className="flex items-center justify-end gap-4 py-2 mb-8">
      <button 
        onClick={onComposeClick}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:bg-indigo-500 hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition-all duration-200 hover:-translate-y-[1px]"
      >
        <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
        Add Lead
      </button>
    </div>
  );
}
