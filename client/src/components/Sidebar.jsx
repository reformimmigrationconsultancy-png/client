import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  InboxIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Leads', href: '/leads', icon: UserGroupIcon },
  { name: 'Emails', href: '/emails', icon: EnvelopeIcon },
  { name: 'Inbox', href: '/inbox', icon: InboxIcon },
  { name: 'Sent', href: '/sent', icon: PaperAirplaneIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];


function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ onClose }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex grow flex-col gap-y-6 overflow-y-auto border-r border-slate-200 bg-white px-6 pb-6 shadow-sm">
      <div className="flex h-20 shrink-0 items-center justify-center border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 tracking-wide">
          Manpreet
        </h1>
      </div>
      <nav className="flex flex-1 flex-col mt-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="space-y-1">
              {navigation.map((item) => {
                const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => onClose && onClose()}
                      className={classNames(
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        'group flex gap-x-4 rounded-lg p-3 text-sm font-medium transition-all duration-200'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
                          'h-5 w-5 shrink-0 transition-colors duration-200'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          <li className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-x-3 px-2 py-3 bg-white hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-slate-800 truncate">{user?.name || 'Agent'}</p>
                    <p className="text-xs text-slate-500 truncate">Principal Broker</p>
                  </div>
               </div>
               
               <button
                  onClick={logout}
                  className="flex items-center justify-center gap-2 w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all text-sm font-medium"
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                  Sign Out
               </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}
