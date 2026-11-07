import React from 'react';
import { 
  UserGroupIcon, 
  UserPlusIcon, 
  ChatBubbleLeftRightIcon, 
  ClockIcon,
  ArrowUpRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function KpiCards({ stats, reminders = [], onNavigateStage }) {
  const totalLeads = stats?.totalLeads || 0;
  const newLeads = stats?.pipeline?.newLeads || 0;
  const openConvs = stats?.openConversations || 0;
  
  const now = new Date();
  const actionItemsCount = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) <= now).length;
  const overdueCount = stats?.overdueFollowUps !== undefined ? stats.overdueFollowUps : actionItemsCount;

  const cards = [
    {
      id: 'total',
      title: 'TOTAL PROSPECTS',
      value: totalLeads,
      trend: totalLeads > 0 ? 'Active in database' : 'Ready for leads',
      subtitle: 'Across all pipeline stages',
      icon: UserGroupIcon,
      colorTheme: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600 border-indigo-100',
      iconBg: 'bg-indigo-50 text-indigo-600',
      badge: 'All Pipeline',
      onClick: () => onNavigateStage && onNavigateStage('all')
    },
    {
      id: 'new',
      title: 'NEW LEADS',
      value: newLeads,
      trend: newLeads > 0 ? 'Requires initial call' : 'All caught up',
      subtitle: 'Uncontacted opportunities',
      icon: UserPlusIcon,
      colorTheme: 'from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
      badge: 'Immediate Action',
      pulse: newLeads > 0,
      onClick: () => onNavigateStage && onNavigateStage('new_lead')
    },
    {
      id: 'conversations',
      title: 'CONVERSATIONS',
      value: openConvs,
      trend: openConvs > 0 ? 'Active conversations' : 'Inbox clear',
      subtitle: 'Open email & chat threads',
      icon: ChatBubbleLeftRightIcon,
      colorTheme: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'Engagement',
    },
    {
      id: 'attention',
      title: 'FOLLOW-UPS DUE',
      value: overdueCount,
      trend: overdueCount > 0 ? `${overdueCount} action items overdue` : 'All tasks up to date',
      subtitle: 'Scheduled reminders & calls',
      icon: ClockIcon,
      colorTheme: overdueCount > 0 
        ? 'from-rose-500/10 to-rose-500/5 text-rose-600 border-rose-100' 
        : 'from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-100',
      iconBg: overdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600',
      badge: overdueCount > 0 ? 'Needs Attention' : 'Healthy',
      onClick: () => window.location.href = '/followups'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`group relative bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden ${
              card.onClick ? 'cursor-pointer hover:border-indigo-300 hover:-translate-y-0.5' : ''
            }`}
          >
            {/* Top Accent Bar on Hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/60 transition-all duration-300"></div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                    <IconComponent className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                </div>

                {card.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.colorTheme} flex items-center gap-1`}>
                    {card.pulse && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>}
                    {card.badge}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </span>
                {card.onClick && (
                  <ArrowUpRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-slate-700 truncate">
                {card.trend}
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate">
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
