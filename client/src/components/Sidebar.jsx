import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Leads Pipeline', href: '/leads', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ onClose }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'M';
  const userName = user?.name || 'Manpreet Singh';

  return (
    <div className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white h-full">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center shadow-sm">
            <SparklesIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-bold text-slate-900 tracking-tight leading-none">
              Manpreet CRM
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-1 flex-col mt-4 px-3">
        <ul role="list" className="flex flex-1 flex-col gap-y-6">
          <li>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Main Menu
            </div>
            <ul role="list" className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => onClose && onClose()}
                      className={classNames(
                        isActive
                          ? 'bg-indigo-50/50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium',
                        'group relative flex items-center gap-x-3 rounded-md px-3 py-2 text-[13px] transition-colors'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-indigo-600" />
                      )}
                      <item.icon
                        className={classNames(
                          isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
                          'h-4 w-4 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User Profile Card & Logout */}
          <li className="mt-auto pb-4 px-1">
            <div className="flex flex-col gap-1 border-t border-slate-100 pt-4 px-2">
              <div className="flex items-center gap-x-3 py-2">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                  {userInitial}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{userName}</p>
                  <p className="text-[11px] text-slate-500 truncate">Administrator</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors text-[12px] font-medium w-full text-left mt-1"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4 shrink-0 text-slate-400" />
                Sign Out
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
