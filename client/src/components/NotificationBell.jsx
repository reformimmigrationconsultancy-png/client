import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  BellIcon, 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon, 
  SparklesIcon, 
  EnvelopeIcon, 
  UserIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

export default function NotificationBell({ socket }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all | followup | automation | email
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // Close popover when clicking outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('new_notification', handleNewNotif);
    return () => {
      socket.off('new_notification', handleNewNotif);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { type: activeTab } });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [activeTab, isOpen]);

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, readAt: new Date() } : n));
        setUnreadCount(res.data.unreadCount ?? Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDismiss = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        setUnreadCount(res.data.unreadCount ?? unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateToEntity = (notif) => {
    handleMarkRead(notif._id);
    setIsOpen(false);

    if (notif.entityType === 'reminder') {
      navigate(`/followups?highlight=${notif.entityId}`);
    } else if (notif.entityType === 'client') {
      navigate(`/clients/${notif.entityId}`);
    } else if (notif.entityType === 'automation') {
      navigate(`/automations`);
    } else if (notif.entityType === 'conversation') {
      navigate(`/leads`);
    } else {
      navigate(`/followups`);
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'critical') {
      return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border border-rose-200">Overdue</span>;
    }
    if (priority === 'high') {
      return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border border-amber-200">Due Now</span>;
    }
    if (priority === 'medium') {
      return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border border-blue-200">Upcoming</span>;
    }
    return null;
  };

  const getTypeIcon = (type) => {
    if (type === 'automation') return <SparklesIcon className="w-4 h-4 text-purple-600" />;
    if (type === 'email') return <EnvelopeIcon className="w-4 h-4 text-blue-600" />;
    if (type === 'lead') return <UserIcon className="w-4 h-4 text-emerald-600" />;
    return <ClockIcon className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all focus:outline-none"
        title="CRM Notifications & Reminders"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="w-5 h-5 text-blue-600 animate-pulse" />
        ) : (
          <BellIcon className="w-5 h-5" />
        )}

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-Down Notifications Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-2 pt-2 gap-1 overflow-x-auto text-[11px]">
            {[
              { id: 'all', label: 'All' },
              { id: 'followup', label: 'Follow-ups' },
              { id: 'automation', label: 'Automations' },
              { id: 'email', label: 'Emails' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <BellIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No notifications</p>
                <p className="text-[11px] text-slate-400">You're all caught up on follow-ups and alerts.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt;
                const createdText = notif.createdAt 
                  ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
                  : 'recently';

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNavigateToEntity(notif)}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 group relative ${
                      isUnread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Unread Dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                    )}

                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getTypeIcon(notif.type)}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </h4>
                        {getPriorityBadge(notif.priority)}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{notif.message}</p>

                      {notif.leadName && (
                        <span className="inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1">
                          Lead: {notif.leadName}
                        </span>
                      )}

                      <span className="block text-[10px] text-slate-400 mt-1">{createdText}</span>
                    </div>

                    {/* Action Menu */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleDismiss(notif._id, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                        title="Dismiss"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/followups');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              View all follow-ups
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
