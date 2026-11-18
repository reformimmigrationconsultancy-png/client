import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRightIcon, 
  ChevronRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, GlobeAltIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

const STAGE_CONFIG = {
  new_lead: { label: 'New Lead', bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500 ring-blue-200' },
  contacted: { label: 'Contacted', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', dot: 'bg-indigo-500 ring-indigo-200' },
  interested: { label: 'Negotiation', bg: 'bg-purple-50 text-purple-700 border-purple-200/80', dot: 'bg-purple-500 ring-purple-200' },
  documents_received: { label: 'Documentation', bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500 ring-amber-200' },
  approved: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500 ring-emerald-200' },
  closed: { label: 'Closed/Won', bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400 ring-slate-200' }
};

const SourceBadge = ({ source }) => {
  const src = (source || 'manual').toLowerCase();
  if (src === 'facebook' || src === 'instagram' || src === 'meta') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        <ChatBubbleLeftRightIcon className="w-3 h-3 text-blue-600" />
        Meta Ads
      </span>
    );
  }
  if (src === 'google') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
        <GlobeAltIcon className="w-3 h-3 text-rose-600" />
        Google Ads
      </span>
    );
  }
  if (src === 'website') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <GlobeAltIcon className="w-3 h-3 text-emerald-600" />
        Website
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
      <UserGroupIcon className="w-3 h-3 text-slate-500" />
      Direct / Manual
    </span>
  );
};

export default function RecentLeadsTable({ leads = [], loading = false, user: propUser }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const handleCopyLeadLink = (lead, e) => {
    e.stopPropagation();
    const token = lead.portalToken || lead._id;
    const link = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(link);
    toast.success(`📋 Copied intake link for ${lead.fullName || 'Lead'}!`);
  };

  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return 'L';
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
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white via-white to-slate-50/40">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
            Recent Prospects & Leads
          </h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
            {leads.length > 0 ? `${leads.length} Active` : 'Up to date'}
          </span>
        </div>
        <Link
          to="/leads"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors group"
        >
          View all in leads
          <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100"></div>
                <div className="space-y-1.5">
                  <div className="w-28 h-3.5 bg-slate-200 rounded"></div>
                  <div className="w-36 h-2.5 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="w-20 h-5 bg-slate-100 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 border border-indigo-100 shadow-2xs">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          {user?.role === 'staff' && !user?.permissions?.viewAllLeads ? (
            <>
              <h3 className="text-sm font-bold text-slate-900">No leads assigned to you yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Admin jab tak aapko leads assign nahi karega, tab tak dashboard aur pipeline empty rahegi. Admin ke assign karte hi aapki leads yahan show hongi.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-900">No leads recorded yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Sync your Meta lead ads or click "+ Add Lead" to record your first customer opportunity.
              </p>
              <button
                onClick={() => navigate('/leads?action=new')}
                className="mt-4 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                Create First Lead
              </button>
            </>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3 px-6">Prospect Name</th>
                <th className="py-3 px-6">Channel / Source</th>
                <th className="py-3 px-6">Pipeline Stage</th>
                <th className="py-3 px-6">Deal Value</th>
                <th className="py-3 px-6">Date Added</th>
                <th className="py-3 px-6 text-right w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => {
                const stageInfo = STAGE_CONFIG[lead.stage] || STAGE_CONFIG['new_lead'];
                return (
                  <tr 
                    key={lead._id}
                    onClick={() => navigate(`/clients/${lead._id}`)}
                    className="hover:bg-indigo-50/20 transition-all duration-150 group cursor-pointer"
                  >
                    {/* Lead Info */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0 border border-slate-200/80 group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">
                          {getInitials(lead.fullName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[13.5px] text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {lead.fullName || 'Untitled Prospect'}
                          </span>
                          {lead.visaDetails?.visaType && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded mt-0.5 w-max">
                              {lead.visaDetails.targetCountry ? `${lead.visaDetails.targetCountry} • ` : ''}{lead.visaDetails.visaType}
                            </span>
                          )}
                          <div className="flex items-center gap-2 text-[11.5px] text-slate-400 mt-0.5">
                            {lead.email && lead.email !== 'N/A' && (
                              <span className="flex items-center gap-1 hover:text-slate-600">
                                <EnvelopeIcon className="w-3 h-3 text-slate-400" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phone && lead.phone !== 'N/A' && (
                              <span className="flex items-center gap-1 font-medium text-slate-600">
                                <PhoneIcon className="w-3 h-3 text-slate-400" />
                                {lead.phone}
                              </span>
                            )}
                            {(!lead.email || lead.email === 'N/A') && (!lead.phone || lead.phone === 'N/A') && (
                              <span className="italic text-slate-400">No contact info</span>
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stageInfo.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stageInfo.dot} ring-2`}></span>
                        {stageInfo.label}
                      </span>
                    </td>

                    {/* Deal Value */}
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {lead.loanAmount ? (
                        <span className="text-xs font-bold text-slate-800">
                          ${Number(lead.loanAmount).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-6 whitespace-nowrap text-slate-400 text-xs font-medium">
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy specific client's portal link */}
                        <button
                          onClick={(e) => handleCopyLeadLink(lead, e)}
                          title={`Copy intake link for ${lead.fullName}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp direct chat */}
                        {lead.phone && lead.phone !== 'N/A' && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.fullName}, please fill out your Visa assessment details here: ${window.location.origin}/portal/${lead.portalToken || lead._id}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Send intake link on WhatsApp"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all"
                          >
                            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-emerald-600" />
                          </a>
                        )}

                        <button
                          onClick={() => navigate(`/clients/${lead._id}`)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all"
                          title="View lead profile"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
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
