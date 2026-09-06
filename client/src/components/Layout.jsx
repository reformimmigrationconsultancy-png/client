import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import io from 'socket.io-client';
import api, { BACKEND_URL } from '../utils/api';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play blocked:', e));
    } catch (err) {}
  };

  useEffect(() => {
    if (!user) return;
    
    const newSocket = io(BACKEND_URL, { withCredentials: true, transports: ['polling', 'websocket'] });
    setSocket(newSocket);
    
    newSocket.on('new_lead', (lead) => {
      playNotificationSound();
      toast.success(
        <div className="flex flex-col gap-1.5 w-full max-w-[85vw] sm:min-w-[280px]">
           <div className="flex justify-between items-start gap-2 mb-0.5">
             <span className="font-bold text-sm text-white leading-tight">New Opportunity</span>
             <span className="text-[10px] uppercase text-slate-400 font-black tracking-wider shrink-0 mt-0.5">{lead?.source || 'Lead'}</span>
           </div>
           <span className="text-sm text-emerald-400 font-bold truncate w-full">{lead?.fullName || 'Unknown'}</span>
           <span className="text-xs text-slate-300 truncate w-full">{lead?.email || lead?.phone || 'Check Pipeline'}</span>
        </div>, {
        icon: '🔥',
        style: { borderRadius: '16px', background: '#111b21', color: '#fff', padding: '14px 16px', borderLeft: '5px solid #ef4444', maxWidth: '100%', wordBreak: 'break-word' },
        duration: 6000
      });
    });

    newSocket.on('new_client', (client) => {
      playNotificationSound();
      toast.success(
        <div className="flex flex-col w-full max-w-[85vw] sm:min-w-[250px]">
           <span className="font-bold text-sm text-white">New Client: {client?.fullName || 'Unknown'}</span>
        </div>, {
        icon: '📈',
        style: { borderRadius: '16px', background: '#111b21', color: '#fff', padding: '14px 16px', borderLeft: '5px solid #3b82f6', maxWidth: '100%' },
        duration: 6000
      });
    });

    // Real-Time Due Reminder / Overdue Alert Toast Handler
    newSocket.on('due_reminder', ({ type, notification, reminder, lead }) => {
      playNotificationSound();

      const leadName = lead?.fullName || notification?.leadName || 'Client';
      const reminderId = reminder?._id || notification?.entityId;

      toast((t) => (
        <div className="flex flex-col gap-2 w-full max-w-[340px] text-xs font-sans">
          <div className="flex justify-between items-start">
            <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              {type === 'overdue' ? '⚠️ Follow-up Overdue' : type === 'duenow' ? '🔴 Follow-up Due Now' : '🔔 Follow-up Coming Up'}
            </span>
            <button onClick={() => toast.dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            <p className="font-bold text-slate-800 text-xs">{reminder?.title || notification?.title}</p>
            <p className="text-slate-500">Lead: <strong className="text-slate-700">{leadName}</strong></p>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate(`/followups?highlight=${reminderId}`);
              }}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-center shadow-2xs"
            >
              Open
            </button>

            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.post(`/reminders/${reminderId}/complete`);
                  toast.success('Follow-up completed');
                } catch (err) {
                  toast.error('Failed to complete task');
                }
              }}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
            >
              Complete
            </button>

            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.post(`/reminders/${reminderId}/snooze`, { snoozeMinutes: 30 });
                  toast.success('Snoozed for 30 min');
                } catch (err) {
                  toast.error('Failed to snooze');
                }
              }}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg"
            >
              Snooze
            </button>
          </div>
        </div>
      ), {
        duration: 10000,
        style: {
          borderRadius: '16px',
          background: '#ffffff',
          color: '#0f172a',
          padding: '16px',
          borderLeft: type === 'overdue' ? '6px solid #e11d48' : type === 'duenow' ? '6px solid #f59e0b' : '6px solid #3b82f6',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      });
    });

    return () => {
      newSocket.off('new_lead');
      newSocket.off('new_client');
      newSocket.off('due_reminder');
      newSocket.close();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex bg-slate-50 items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Desktop Sidebar */}
      <div className="w-64 flex-shrink-0 hidden md:flex flex-col border-r shadow-sm">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Drawer content */}
          <div className="relative flex w-full max-w-[280px] flex-1 flex-col bg-white transition-all duration-300 ease-in-out shadow-2xl">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-900/50 hover:bg-slate-900/80 text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Floating Notification Header Bar */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-between shadow-2xs z-30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-600 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">Commercial CRM System</span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell socket={socket} />
            
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                {user.name?.charAt(0) || 'A'}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block">{user.name || 'Admin'}</span>
            </div>
          </div>
        </div>

        {/* Outlet Area - Fixed to remaining space */}
        <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
          <Outlet context={{ socket }} />
        </main>
      </div>
    </div>
  );
}
