import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import io from 'socket.io-client';
import { BACKEND_URL } from '../utils/api';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play blocked:', e));
    } catch (err) {}
  };

  useEffect(() => {
    if (!user) return;
    
    const socket = io(BACKEND_URL, { withCredentials: true, transports: ['polling', 'websocket'] });
    
    socket.on('new_lead', (lead) => {
      playNotificationSound();
      toast.success(
        <div className="flex flex-col gap-1.5 w-full max-w-[85vw] sm:min-w-[280px]">
           <div className="flex justify-between items-start gap-2 mb-0.5">
             <span className="font-bold text-sm text-white leading-tight">New Opportunity</span>
             <span className="text-[10px] uppercase text-slate-400 font-black tracking-wider shrink-0 mt-0.5">{lead.source || 'Lead'}</span>
           </div>
           <span className="text-sm text-emerald-400 font-bold truncate w-full">{lead.fullName || 'Unknown'}</span>
           <span className="text-xs text-slate-300 truncate w-full">{lead.email || lead.phone || 'Check Pipeline'}</span>
        </div>, {
        icon: '🔥',
        style: { borderRadius: '16px', background: '#111b21', color: '#fff', padding: '14px 16px', borderLeft: '5px solid #ef4444', maxWidth: '100%', wordBreak: 'break-word' },
        duration: 6000
      });
    });

    socket.on('new_client', (client) => {
      playNotificationSound();
      toast.success(
        <div className="flex flex-col w-full max-w-[85vw] sm:min-w-[250px]">
           <span className="font-bold text-sm text-white">New Client: {client.fullName || 'Unknown'}</span>
        </div>, {
        icon: '📈',
        style: { borderRadius: '16px', background: '#111b21', color: '#fff', padding: '14px 16px', borderLeft: '5px solid #3b82f6', maxWidth: '100%' },
        duration: 6000
      });
    });

    socket.on('new_message', (msg) => {
      if (msg.sender !== 'client') return;
      playNotificationSound();
      
      const platform = msg.conversationId?.platform || msg.messageType || 'message';
      const clientName = msg.conversationId?.client?.fullName || 'Client';
      
      let icon = '💬';
      let borderColor = '#00a884'; // whatsapp green
      
      if (platform === 'email') { icon = '📧'; borderColor = '#f59e0b'; }
      else if (platform === 'instagram') { icon = '📸'; borderColor = '#ec4899'; }
      else if (platform === 'facebook') { icon = '⚡'; borderColor = '#3b82f6'; }

      toast(
        <div className="flex flex-col gap-1 w-full max-w-[85vw] sm:min-w-[280px]">
           <div className="flex justify-between items-start gap-3 mb-0.5">
             <span className="font-bold text-sm text-white line-clamp-1 flex-1">{clientName}</span>
             <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest shrink-0 mt-1">{platform}</span>
           </div>
           <span className="text-xs text-slate-300 line-clamp-2 w-full leading-relaxed">{msg.content || 'Sent an attachment'}</span>
        </div>, {
        icon: icon,
        style: { borderRadius: '16px', background: '#111b21', color: '#fff', padding: '14px 16px', borderLeft: `5px solid ${borderColor}`, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', maxWidth: '100%' },
        duration: 6000
      });
    });

    return () => {
      socket.off('new_lead');
      socket.off('new_client');
      socket.off('new_message');
      socket.close();
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
        {/* Top Header Placeholder (mobile) */}
        <div className="md:hidden flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm z-30">
          <h1 className="text-xl font-bold text-slate-800">Manpreet</h1>
          <button
            type="button"
            className="p-2 -mr-2 text-slate-500 hover:text-slate-600 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Outlet Area - Fixed to remaining space */}
        <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
