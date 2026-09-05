import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

export default function RecentActivityCard({ recentCalls = [], recentLeads = [] }) {
  const activities = [];

  if (recentCalls && recentCalls.length > 0) {
    recentCalls.forEach(call => {
      activities.push({
        id: call._id || Math.random(),
        type: 'call',
        title: `Phone call logged with ${call.client?.fullName || 'Client'}`,
        time: call.callTime || call.createdAt,
        status: call.status || 'completed'
      });
    });
  }

  if (recentLeads && recentLeads.length > 0) {
    recentLeads.slice(0, 3).forEach(lead => {
      activities.push({
        id: `lead_${lead._id}`,
        type: 'lead',
        title: `New lead generated: ${lead.fullName} (${lead.source || 'Meta Ads'})`,
        time: lead.createdAt,
        status: 'new'
      });
    });
  }

  activities.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  const displayActivities = activities.slice(0, 4);

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Just now';
    try {
      return formatDistanceToNow(new Date(timeStr), { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] ring-1 ring-slate-100 flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-indigo-600" />
          Recent Activity Feed
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">Live events</span>
      </div>

      <div className="p-5 flex-1">
        {displayActivities.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-slate-400 font-medium">
            No activity recorded yet.
          </div>
        ) : (
          <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
            {displayActivities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-3 text-[12px]">
                <span className="absolute -left-[17.5px] top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {formatTime(act.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
