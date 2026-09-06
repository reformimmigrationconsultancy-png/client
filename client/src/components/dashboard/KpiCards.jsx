import React from 'react';
import { 
  UserGroupIcon, 
  SparklesIcon, 
  ChatBubbleLeftRightIcon, 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function KpiCards({ stats, reminders = [], onNavigateStage }) {
  const totalLeads = stats?.totalLeads || 0;
  const newLeads = stats?.pipeline?.newLeads || 0;
  const openConvs = stats?.openConversations || 0;
  
  const now = new Date();
  const actionItemsCount = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) <= now).length;

  const cards = [
    {
      id: 'total',
      title: 'TOTAL LEADS',
      value: totalLeads,
      trend: totalLeads > 0 ? 'Across all stages' : 'No leads yet',
      subtitle: 'Active prospects in CRM',
      icon: UserGroupIcon,
      accent: 'text-indigo-600',
    },
    {
      id: 'new',
      title: 'NEW LEADS',
      value: newLeads,
      trend: newLeads > 0 ? 'Awaiting contact' : 'All caught up',
      subtitle: 'Uncontacted leads',
      icon: SparklesIcon,
      accent: 'text-blue-600',
      onClick: () => onNavigateStage && onNavigateStage('new_lead')
    },
    {
      id: 'conversations',
      title: 'CONVERSATIONS',
      value: openConvs,
      trend: openConvs > 0 ? 'Need response' : 'Inbox clear',
      subtitle: 'Open email threads',
      icon: ChatBubbleLeftRightIcon,
      accent: 'text-emerald-600',
    },
    {
      id: 'attention',
      title: 'ACTION ITEMS',
      value: actionItemsCount,
      trend: actionItemsCount > 0 ? 'Require immediate focus' : 'No urgent tasks',
      subtitle: 'Replies & document reviews',
      icon: ExclamationTriangleIcon,
      accent: actionItemsCount > 0 ? 'text-amber-600' : 'text-slate-400',
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
            className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-200 flex flex-col ${
              card.onClick ? 'cursor-pointer hover:bg-slate-50/50 hover:border-indigo-200' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <IconComponent className={`w-4 h-4 ${card.accent}`} strokeWidth={2} />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                {card.title}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
                {card.value}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 mt-auto">
              <span className="text-[12px] font-semibold text-slate-700">
                {card.trend}
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
