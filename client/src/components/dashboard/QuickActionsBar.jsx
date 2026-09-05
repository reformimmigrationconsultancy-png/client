import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, EnvelopeIcon, UserGroupIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function QuickActionsBar({ onComposeClick }) {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'add_lead',
      label: '+ Add Lead',
      icon: PlusIcon,
      bgColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      onClick: () => navigate('/leads')
    },
    {
      id: 'compose',
      label: 'Compose Email',
      icon: EnvelopeIcon,
      bgColor: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
      onClick: () => onComposeClick && onComposeClick()
    },
    {
      id: 'pipeline',
      label: 'View Pipeline',
      icon: UserGroupIcon,
      bgColor: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
      onClick: () => navigate('/leads')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      bgColor: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
        Quick CRM Actions:
      </span>
      <div className="flex flex-wrap items-center gap-2.5">
        {actions.map((act) => {
          const IconComp = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${act.bgColor}`}
            >
              <IconComp className="w-4 h-4" />
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
