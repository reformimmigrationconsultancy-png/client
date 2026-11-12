import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  BriefcaseIcon,
  BoltIcon,
  ViewColumnsIcon,
  ClockIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { 
    section: 'MAIN MENU',
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon, badge: null },
      { name: 'Leads List', href: '/leads', icon: UserGroupIcon, badge: null },
      { name: 'Pipeline View', href: '/kanban', icon: ViewColumnsIcon, badge: 'Pipeline' },
      { name: 'Follow-ups', href: '/followups', icon: ClockIcon, badge: null }
    ]
  },
  {
    section: 'AUTOMATION & TOOLS',
    items: [
      { name: 'Workflow Rules', href: '/automations', icon: BoltIcon, badge: null },
      { name: 'Email Templates', href: '/templates', icon: DocumentDuplicateIcon, badge: null },
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, badge: null }
    ]
  }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ onClose }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'M';
  const userName = user?.name || 'Maninder Pal Singh';

  return (
    <div className="flex w-full shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200/80 bg-white h-full select-none">
      <div>
        {/* Brand Header */}
        <div className="flex h-[70px] shrink-0 items-center justify-between px-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs text-white font-extrabold text-[15px] tracking-tight ring-1 ring-black/5">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-[15.5px] font-extrabold text-slate-900 tracking-tight leading-snug">
                Maninder Pal Singh
              </span>
              <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">
                Commercial CRM
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-1 flex-col mt-5 px-3.5 space-y-6">
          {navigation.map((group) => (
            <div key={group.section}>
              <div className="text-[11.5px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                {group.section}
              </div>
              <ul role="list" className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={() => onClose && onClose()}
                        className={classNames(
                          isActive
                            ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-2xs border border-indigo-100/70'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold',
                          'group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[14.5px] transition-all duration-150 ease-in-out'
                        )}
                      >
                        <div className="flex items-center gap-x-3.5">
                          <Icon
                            className={classNames(
                              isActive 
                                ? 'text-indigo-600' 
                                : 'text-slate-400 group-hover:text-indigo-600 transition-colors',
                              'h-[21px] w-[21px] shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className={classNames(
                            isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600',
                            'text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Footer Card */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 mt-auto">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {userInitial}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div className="flex-1 overflow-hidden min-w-0">
            <p className="text-[14px] font-bold text-slate-900 truncate leading-tight">{userName}</p>
            <p className="text-[11.5px] text-slate-500 font-medium truncate mt-0.5">Admin • Online</p>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
