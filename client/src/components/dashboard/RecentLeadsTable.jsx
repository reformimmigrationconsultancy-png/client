import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowRightIcon, 
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, GlobeAltIcon, UserGroupIcon } from '@heroicons/react/24/solid';

const STAGE_CONFIG = {
  new_lead: { label: 'New', bg: 'bg-blue-50 text-blue-700' },
  contacted: { label: 'Contacted', bg: 'bg-slate-100 text-slate-700' },
  interested: { label: 'Qualified', bg: 'bg-purple-50 text-purple-700' },
  documents_received: { label: 'Reviewing', bg: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700' },
  closed: { label: 'Closed', bg: 'bg-slate-50 text-slate-500' }
};

const SourceBadge = ({ source }) => {
  const src = (source || 'manual').toLowerCase();
  if (src === 'facebook' || src === 'instagram' || src === 'meta') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
        <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-blue-500" />
        Meta Ads
      </span>
    );
  }
  if (src === 'google') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
        <GlobeAltIcon className="w-3.5 h-3.5 text-rose-500" />
        Google Ads
      </span>
    );
  }
  if (src === 'website') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
        <GlobeAltIcon className="w-3.5 h-3.5 text-emerald-500" />
        Website
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
      <UserGroupIcon className="w-3.5 h-3.5 text-slate-400" />
      Manual
    </span>
  );
};

export default function RecentLeadsTable({ leads = [], loading = false }) {
  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, h:mm a');
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
            Recent Leads
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            {leads.length > 0 ? `${leads.length} new today` : 'Up to date'}
          </span>
        </div>
        <Link
          to="/leads"
          className="text-[13px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors group"
        >
          View all
          <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-6 space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100"></div>
                <div className="space-y-2">
                  <div className="w-24 h-3 bg-slate-200 rounded"></div>
                  <div className="w-32 h-2 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="w-16 h-5 bg-slate-100 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        /* Empty State */
        <div className="p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
            <UserGroupIcon className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-900">No recent leads</h3>
          <p className="text-[13px] text-slate-500 mt-1">New leads will appear here.</p>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-6">Lead</th>
                <th className="py-3 px-6">Source</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Received</th>
                <th className="py-3 px-6 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {leads.map((lead) => {
                const stageInfo = STAGE_CONFIG[lead.stage] || STAGE_CONFIG['new_lead'];
                return (
                  <tr 
                    key={lead._id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  >
                    {/* Lead Info */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center text-[12px] shrink-0 ring-1 ring-slate-200/50">
                          {getInitials(lead.fullName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[14px] text-slate-900 leading-snug">
                            {lead.fullName}
                          </span>
                          <div className="flex items-center gap-2 text-[12px] text-slate-400 leading-snug mt-0.5">
                            {lead.email && lead.email !== 'N/A' && <span>{lead.email}</span>}
                            {lead.email && lead.email !== 'N/A' && lead.phone && lead.phone !== 'N/A' && (
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            )}
                            {lead.phone && lead.phone !== 'N/A' && <span>{lead.phone}</span>}
                            {(!lead.email || lead.email === 'N/A') && (!lead.phone || lead.phone === 'N/A') && (
                              <span>Contact pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <SourceBadge source={lead.source} />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${stageInfo.bg}`}>
                        {stageInfo.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-slate-400 text-[13px]">
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button className="p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-900 hover:bg-slate-200/50 transition-all">
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
