import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  ViewColumnsIcon, 
  EnvelopeIcon, 
  CalendarDaysIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function DashboardHeader({ user, onComposeClick }) {
  const navigate = useNavigate();

  // Get dynamic greeting based on hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.name ? user.name.split(' ')[0] : 'Maninder';

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  const handleCopyIntakeLink = () => {
    const link = `${window.location.origin}/apply`;
    navigator.clipboard.writeText(link);
    toast.success('📋 Visa Application Form link copied! You can share it with clients.');
  };

  const handleShareWhatsApp = () => {
    const link = `${window.location.origin}/apply`;
    const message = `Hello,\n\nPlease complete your Visa Assessment & Document submission using this link:\n${link}\n\nThank you,\nManinder Pal Singh Immigration Services`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            CRM Overview
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <CalendarDaysIcon className="w-3.5 h-3.5" />
            {todayFormatted}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {greeting}, {name} 👋
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Here is your real-time sales pipeline and lead conversion performance.
        </p>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Copy Client Intake Link */}
        <button
          onClick={handleCopyIntakeLink}
          title="Copy Visa Intake Form link to send to clients"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg shadow-2xs transition-all hover:-translate-y-0.5"
        >
          <LinkIcon className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
          <span>Copy Intake Link</span>
        </button>

        {/* Share via WhatsApp */}
        <button
          onClick={handleShareWhatsApp}
          title="Share Visa form link directly on WhatsApp"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg shadow-2xs transition-all hover:-translate-y-0.5"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
          <span className="hidden sm:inline">WhatsApp Form</span>
        </button>

        <button
          onClick={() => navigate('/kanban')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all"
        >
          <ViewColumnsIcon className="w-4 h-4 text-slate-500" />
          Pipeline Board
        </button>

        {onComposeClick && (
          <button
            onClick={onComposeClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all"
          >
            <EnvelopeIcon className="w-4 h-4 text-slate-500" />
            Send Email
          </button>
        )}

        <button
          onClick={() => navigate('/leads?action=new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-sm shadow-indigo-200 transition-all hover:shadow-md"
        >
          <PlusIcon className="w-4 h-4 stroke-[2.5]" />
          Add Lead
        </button>
      </div>
    </div>
  );
}
