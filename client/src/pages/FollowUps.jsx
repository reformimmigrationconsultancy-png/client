import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format, isToday, isYesterday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  UserIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  Squares2X2Icon, 
  ListBulletIcon, 
  ArrowPathIcon, 
  XMarkIcon, 
  SparklesIcon, 
  BellIcon, 
  EllipsisHorizontalIcon, 
  TrashIcon, 
  PencilIcon, 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CheckIcon,
  ChevronDownIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const TYPE_CONFIG = {
  call: { label: 'Call', icon: PhoneIcon, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  email: { label: 'Email', icon: EnvelopeIcon, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  meeting: { label: 'Meeting', icon: CalendarIcon, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  whatsapp: { label: 'WhatsApp', icon: ChatBubbleLeftRightIcon, color: 'text-green-600 bg-green-50 border-green-200' },
  sms: { label: 'SMS', icon: ChatBubbleLeftRightIcon, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  task: { label: 'Task', icon: CheckCircleIcon, color: 'text-slate-600 bg-slate-100 border-slate-200' },
  note: { label: 'Note', icon: DocumentTextIcon, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  custom: { label: 'Custom', icon: SparklesIcon, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', class: 'bg-slate-100 text-slate-700 border-slate-200' },
  medium: { label: 'Medium', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'High', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgent', class: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' },
};

const TITLE_SUGGESTIONS = [
  'Call lead',
  'Send follow-up email',
  'Schedule consultation',
  'Request documents',
  'Review lead details',
  'Check visa status',
  'Follow up on application',
  'Confirm appointment'
];

export default function FollowUps() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initial params
  const initialLeadId = searchParams.get('leadId') || '';

  // Main Data States
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // View State (List | Board | Calendar)
  const [view, setView] = useState(() => localStorage.getItem('crm_followup_view') || 'list');

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // all, pending, overdue, today, upcoming, completed, snoozed
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [automatedFilter, setAutomatedFilter] = useState('all');

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(!!initialLeadId);
  const [selectedReminder, setSelectedReminder] = useState(null); // Detail drawer
  const [editingReminder, setEditingReminder] = useState(null);

  // Lead Options for Selectors
  const [leadOptions, setLeadOptions] = useState([]);
  const [leadSearchInput, setLeadSearchInput] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLeadObj, setSelectedLeadObj] = useState(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    title: '',
    client: initialLeadId || '',
    type: 'call',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    dueTime: '10:00',
    priority: 'medium',
    assignedTo: user?._id || '',
    reminderOption: '15m',
    repeat: 'none',
    notes: ''
  });

  // Undo Toast State
  const [undoStack, setUndoStack] = useState(null);

  useEffect(() => {
    localStorage.setItem('crm_followup_view', view);
  }, [view]);

  useEffect(() => {
    fetchRemindersAndStats();
  }, [statusFilter, priorityFilter, typeFilter, assignedFilter, automatedFilter, search]);

  useEffect(() => {
    if (initialLeadId) {
      fetchLeadById(initialLeadId);
    }
  }, [initialLeadId]);

  const fetchRemindersAndStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (assignedFilter !== 'all') params.assignedTo = assignedFilter;
      if (automatedFilter !== 'all') params.isAutomated = automatedFilter;

      const [resList, resStats] = await Promise.all([
        api.get('/reminders', { params }),
        api.get('/reminders/stats')
      ]);

      setReminders(resList.data.reminders || []);
      setStats(resStats.data.stats || null);
    } catch (err) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsForSelect = async (query = '') => {
    setLoadingLeads(true);
    try {
      const res = await api.get('/clients', { params: { search: query, limit: 30 } });
      setLeadOptions(res.data.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchLeadById = async (id) => {
    try {
      const res = await api.get(`/clients/${id}`);
      if (res.data?.client) {
        setSelectedLeadObj(res.data.client);
        setFormData(prev => ({ ...prev, client: id }));
      }
    } catch (err) {}
  };

  const handleOpenCreate = () => {
    fetchLeadsForSelect('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}:00`);
      const payload = {
        title: formData.title,
        client: formData.client || null,
        type: formData.type,
        dueDate: dueDateTime.toISOString(),
        priority: formData.priority,
        assignedTo: formData.assignedTo || user?._id,
        reminderOption: formData.reminderOption,
        repeat: formData.repeat,
        notes: formData.notes
      };

      if (editingReminder) {
        await api.put(`/reminders/${editingReminder._id}`, payload);
        toast.success('Follow-up updated successfully');
      } else {
        await api.post('/reminders', payload);
        toast.success('Follow-up created successfully');
      }

      setIsCreateModalOpen(false);
      setEditingReminder(null);
      resetForm();
      fetchRemindersAndStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save follow-up');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      client: '',
      type: 'call',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      dueTime: '10:00',
      priority: 'medium',
      assignedTo: user?._id || '',
      reminderOption: '15m',
      repeat: 'none',
      notes: ''
    });
    setSelectedLeadObj(null);
    setLeadSearchInput('');
  };

  const markComplete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const target = reminders.find(r => r._id === id);
      await api.post(`/reminders/${id}/complete`);
      toast.success(
        <div className="flex items-center justify-between gap-4">
          <span>Task marked as completed</span>
          <button 
            onClick={() => handleUndoComplete(id)}
            className="text-xs bg-slate-800 text-white px-2 py-1 rounded hover:bg-slate-700 font-semibold"
          >
            Undo
          </button>
        </div>,
        { duration: 5000 }
      );
      fetchRemindersAndStats();
      if (selectedReminder?._id === id) {
        setSelectedReminder(prev => prev ? { ...prev, isCompleted: true, status: 'completed' } : null);
      }
    } catch (err) {
      toast.error('Failed to complete task');
    }
  };

  const handleUndoComplete = async (id) => {
    try {
      await api.put(`/reminders/${id}`, { isCompleted: false, status: 'pending' });
      toast.success('Task restored to pending');
      fetchRemindersAndStats();
    } catch (err) {
      toast.error('Failed to restore task');
    }
  };

  const handleRescheduleQuick = async (id, option, e) => {
    if (e) e.stopPropagation();
    try {
      const now = new Date();
      let newDate = new Date();
      if (option === 'later_today') {
        newDate.setHours(now.getHours() + 4);
      } else if (option === 'tomorrow') {
        newDate.setDate(now.getDate() + 1);
        newDate.setHours(10, 0, 0, 0);
      } else if (option === 'next_week') {
        newDate.setDate(now.getDate() + 7);
        newDate.setHours(10, 0, 0, 0);
      }
      await api.post(`/reminders/${id}/reschedule`, { dueDate: newDate.toISOString() });
      toast.success(`Rescheduled to ${format(newDate, 'MMM d, h:mm a')}`);
      fetchRemindersAndStats();
      if (selectedReminder?._id === id) {
        setSelectedReminder(prev => prev ? { ...prev, dueDate: newDate.toISOString(), status: 'pending' } : null);
      }
    } catch (err) {
      toast.error('Failed to reschedule');
    }
  };

  const handleSnoozeQuick = async (id, minutes, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/reminders/${id}/snooze`, { snoozeMinutes: minutes });
      toast.success(`Snoozed for ${minutes >= 60 ? (minutes/60) + ' hour(s)' : minutes + ' mins'}`);
      fetchRemindersAndStats();
      if (selectedReminder?._id === id) {
        setSelectedReminder(null);
      }
    } catch (err) {
      toast.error('Failed to snooze task');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this follow-up?')) return;
    try {
      await api.delete(`/reminders/${id}`);
      toast.success('Follow-up deleted');
      if (selectedReminder?._id === id) setSelectedReminder(null);
      fetchRemindersAndStats();
    } catch (err) {
      toast.error('Failed to delete follow-up');
    }
  };

  // Bulk Actions Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === reminders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reminders.map(r => r._id));
    }
  };

  const toggleSelectOne = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action, payload = {}) => {
    if (selectedIds.length === 0) return;
    try {
      await api.post('/reminders/bulk', { action, ids: selectedIds, payload });
      toast.success(`Bulk action '${action}' applied to ${selectedIds.length} items`);
      setSelectedIds([]);
      fetchRemindersAndStats();
    } catch (err) {
      toast.error('Bulk action failed');
    }
  };

  // Format Helper for Due Dates
  const formatDueDateLabel = (dateStr, status, snoozedUntil) => {
    const due = new Date(dateStr);
    const now = new Date();
    
    if (status === 'snoozed' && snoozedUntil && new Date(snoozedUntil) > now) {
      return { text: `Snoozed until ${format(new Date(snoozedUntil), 'h:mm a')}`, color: 'text-purple-600 bg-purple-50 border-purple-200' };
    }

    const isOverdue = due < now && status !== 'completed';

    let dateText = '';
    if (isToday(due)) dateText = `Today, ${format(due, 'h:mm a')}`;
    else if (isTomorrow(due)) dateText = `Tomorrow, ${format(due, 'h:mm a')}`;
    else if (isYesterday(due)) dateText = `Yesterday, ${format(due, 'h:mm a')}`;
    else dateText = format(due, 'MMM d, h:mm a');

    if (isOverdue) {
      const relTime = formatDistanceToNow(due, { addSuffix: true });
      return { text: `${dateText} (${relTime})`, color: 'text-rose-600 font-semibold bg-rose-50 border-rose-200' };
    }

    return { text: dateText, color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };

  // Filtered & Grouped Data for Board View
  const boardData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const overdue = [];
    const today = [];
    const upcoming = [];
    const completed = [];

    reminders.forEach(r => {
      const due = new Date(r.dueDate);
      if (r.isCompleted || r.status === 'completed') {
        completed.push(r);
      } else if (due < startOfToday) {
        overdue.push(r);
      } else if (due >= startOfToday && due <= endOfToday) {
        today.push(r);
      } else {
        upcoming.push(r);
      }
    });

    return { overdue, today, upcoming, completed };
  }, [reminders]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Top Professional Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Follow-ups & Work Center</h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              Commercial CRM
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Stay on top of every lead task, scheduled call, and automated action.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ListBulletIcon className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Board
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4" />
            New Follow-up
          </button>
        </div>
      </div>

      {/* Real Summary Metric Cards Header */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        <div 
          onClick={() => setStatusFilter('overdue')} 
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all hover:shadow-md ${statusFilter === 'overdue' ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>OVERDUE</span>
            <ExclamationCircleIcon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 mt-1">{stats?.overdue ?? 0}</div>
          <span className="text-[11px] text-slate-400">Needs urgent action</span>
        </div>

        <div 
          onClick={() => setStatusFilter('today')} 
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all hover:shadow-md ${statusFilter === 'today' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>DUE TODAY</span>
            <ClockIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats?.today ?? 0}</div>
          <span className="text-[11px] text-slate-400">Scheduled for today</span>
        </div>

        <div 
          onClick={() => setStatusFilter('upcoming')} 
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all hover:shadow-md ${statusFilter === 'upcoming' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>UPCOMING</span>
            <CalendarIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats?.upcoming ?? 0}</div>
          <span className="text-[11px] text-slate-400">Future tasks</span>
        </div>

        <div 
          onClick={() => setStatusFilter('completed')} 
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all hover:shadow-md ${statusFilter === 'completed' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>COMPLETED</span>
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats?.completed ?? 0}</div>
          <span className="text-[11px] text-slate-400">Successfully done</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] col-span-2 md:col-span-1">
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>COMPLETION RATE</span>
            <SparklesIcon className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.completionRate ?? 0}%</div>
          <span className="text-[11px] text-slate-400">Avg {stats?.avgCompletionHours || '0.0'}h turnaround</span>
        </div>
      </div>

      {/* Advanced Search & Multi-Facet Filter Toolbar */}
      <div className="px-6 py-2 bg-white border-y border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, lead name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending (Active)</option>
            <option value="overdue">Overdue Only</option>
            <option value="today">Due Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="snoozed">Snoozed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="call">Call 📞</option>
            <option value="email">Email ✉️</option>
            <option value="meeting">Meeting 📅</option>
            <option value="whatsapp">WhatsApp 💬</option>
            <option value="sms">SMS 📱</option>
            <option value="task">Task 📋</option>
            <option value="note">Note 📝</option>
          </select>

          {/* Automated Filter */}
          <select
            value={automatedFilter}
            onChange={(e) => setAutomatedFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Manual & Automated</option>
            <option value="false">Manual Only</option>
            <option value="true">Automated Only ⚡</option>
          </select>

          {/* Reset Filters */}
          {(statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || automatedFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setTypeFilter('all');
                setAutomatedFilter('all');
                setSearch('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Selected Count / Bulk Actions Trigger */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
            <span className="text-xs font-bold text-blue-700">{selectedIds.length} selected</span>
            <button
              onClick={() => handleBulkAction('complete')}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded"
            >
              Complete All
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* MAIN VIEW CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-xs font-medium">Loading CRM follow-ups...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-8 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No follow-ups found</h3>
            <p className="text-xs text-slate-500 mb-6">
              {search || statusFilter !== 'all' 
                ? 'No follow-ups match your current search or filter criteria.' 
                : "You're all caught up! Create a new follow-up to stay organized."}
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Create Follow-up
            </button>
          </div>
        ) : (
          <>
            {/* 1. LIST VIEW */}
            {view === 'list' && (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === reminders.length && reminders.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Task / Activity</th>
                        <th className="py-3 px-4">Lead</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Assigned To</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {reminders.map((item) => {
                        const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                        const TypeIcon = typeInfo.icon;
                        const priorityInfo = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                        const dueFormatted = formatDueDateLabel(item.dueDate, item.status, item.snoozedUntil);
                        const isDone = item.isCompleted || item.status === 'completed';

                        return (
                          <tr
                            key={item._id}
                            onClick={() => setSelectedReminder(item)}
                            className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isDone ? 'bg-slate-50/40 opacity-75' : ''}`}
                          >
                            <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item._id)}
                                onChange={(e) => toggleSelectOne(item._id, e)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border ${typeInfo.color}`}>
                                <TypeIcon className="w-3.5 h-3.5" />
                                {typeInfo.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-[240px]">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'} truncate`}>
                                  {item.title}
                                </span>
                                {item.isAutomated && (
                                  <span className="shrink-0 bg-purple-50 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-purple-200">
                                    AUTO
                                  </span>
                                )}
                              </div>
                              {item.notes && <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.notes}</p>}
                            </td>
                            <td className="py-3 px-4">
                              {item.client ? (
                                <div>
                                  <a
                                    href={`/clients/${item.client._id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-semibold text-blue-600 hover:underline hover:text-blue-800"
                                  >
                                    {item.client.fullName}
                                  </a>
                                  <p className="text-[10px] text-slate-400">{item.client.phone || item.client.email || 'No contact info'}</p>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Lead unavailable</span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${dueFormatted.color}`}>
                                <ClockIcon className="w-3 h-3 shrink-0" />
                                {dueFormatted.text}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${priorityInfo.class}`}>
                                {priorityInfo.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center uppercase">
                                  {item.assignedTo?.name ? item.assignedTo.name[0] : 'A'}
                                </div>
                                <span className="text-[11px] font-medium">{item.assignedTo?.name || 'Agent'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {!isDone ? (
                                  <>
                                    <button
                                      onClick={(e) => markComplete(item._id, e)}
                                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                                    >
                                      <CheckIcon className="w-3.5 h-3.5" />
                                      Complete
                                    </button>

                                    {/* Reschedule Dropdown */}
                                    <div className="relative group">
                                      <button className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100">
                                        <ArrowPathIcon className="w-4 h-4" />
                                      </button>
                                      <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-30 py-1 text-left">
                                        <button 
                                          onClick={(e) => handleRescheduleQuick(item._id, 'later_today', e)}
                                          className="w-full px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 text-left font-medium"
                                        >
                                          Later Today (+4h)
                                        </button>
                                        <button 
                                          onClick={(e) => handleRescheduleQuick(item._id, 'tomorrow', e)}
                                          className="w-full px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 text-left font-medium"
                                        >
                                          Tomorrow 10 AM
                                        </button>
                                        <button 
                                          onClick={(e) => handleRescheduleQuick(item._id, 'next_week', e)}
                                          className="w-full px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 text-left font-medium"
                                        >
                                          Next Week
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircleIcon className="w-3.5 h-3.5" /> Done
                                  </span>
                                )}

                                <button
                                  onClick={(e) => handleDelete(item._id, e)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. KANBAN BOARD VIEW */}
            {view === 'board' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-h-[500px]">
                {[
                  { key: 'overdue', label: 'OVERDUE', items: boardData.overdue, border: 'border-t-rose-500', bg: 'bg-rose-50/30' },
                  { key: 'today', label: 'DUE TODAY', items: boardData.today, border: 'border-t-amber-500', bg: 'bg-amber-50/30' },
                  { key: 'upcoming', label: 'UPCOMING', items: boardData.upcoming, border: 'border-t-blue-500', bg: 'bg-blue-50/30' },
                  { key: 'completed', label: 'COMPLETED', items: boardData.completed, border: 'border-t-emerald-500', bg: 'bg-emerald-50/30' }
                ].map(col => (
                  <div key={col.key} className={`bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex flex-col h-full ${col.bg}`}>
                    <div className={`flex justify-between items-center pb-3 border-t-4 ${col.border} pt-2 px-1`}>
                      <h3 className="text-xs font-bold text-slate-800 tracking-tight">{col.label}</h3>
                      <span className="bg-white text-slate-700 text-xs font-extrabold px-2 py-0.5 rounded-full border border-slate-200">
                        {col.items.length}
                      </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {col.items.map(item => {
                        const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                        const TypeIcon = typeInfo.icon;
                        const priorityInfo = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                        const isDone = col.key === 'completed';

                        return (
                          <div
                            key={item._id}
                            onClick={() => setSelectedReminder(item)}
                            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${typeInfo.color}`}>
                                <TypeIcon className="w-3 h-3" />
                                {typeInfo.label}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${priorityInfo.class}`}>
                                {priorityInfo.label}
                              </span>
                            </div>

                            <h4 className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {item.title}
                            </h4>

                            <div className="text-[11px] text-slate-500">
                              {item.client ? (
                                <span className="font-semibold text-blue-600 hover:underline">{item.client.fullName}</span>
                              ) : (
                                <span className="text-slate-400 italic">Lead unavailable</span>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                              <span>{format(new Date(item.dueDate), 'MMM d, h:mm a')}</span>
                              {!isDone && (
                                <button
                                  onClick={(e) => markComplete(item._id, e)}
                                  className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline"
                                >
                                  Done
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {col.items.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs italic">No tasks in {col.label.toLowerCase()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. CALENDAR VIEW */}
            {view === 'calendar' && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900">Schedule Grid ({format(new Date(), 'MMMM yyyy')})</h3>
                  <p className="text-xs text-slate-500">Click any follow-up to view details.</p>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 border-b pb-2">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-3">
                  {/* Calendar simulation grid */}
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateForDay = new Date(2026, 8, dayNum); // Current month
                    const dayTasks = reminders.filter(r => new Date(r.dueDate).getDate() === dayNum);

                    return (
                      <div key={dayNum} className="min-h-[90px] p-1.5 bg-slate-50/60 border border-slate-200/60 rounded-lg flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-600 text-right block">{dayNum}</span>
                        <div className="space-y-1 overflow-y-auto max-h-[60px]">
                          {dayTasks.map(t => (
                            <div
                              key={t._id}
                              onClick={() => setSelectedReminder(t)}
                              className="text-[10px] p-1 rounded bg-white border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 truncate text-left"
                            >
                              <span className="font-bold text-slate-800">{t.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE / EDIT FOLLOW-UP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">
                {editingReminder ? 'Edit Follow-up Task' : 'Create New Follow-up'}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Lead Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Connected Lead <span className="text-rose-500">*</span>
                </label>
                {selectedLeadObj ? (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <span className="font-bold text-blue-900 block">{selectedLeadObj.fullName}</span>
                      <span className="text-[11px] text-blue-700">{selectedLeadObj.email || selectedLeadObj.phone || 'Lead'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedLeadObj(null); setFormData(p => ({ ...p, client: '' })); }}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search lead by name, email, or phone..."
                      value={leadSearchInput}
                      onChange={(e) => {
                        setLeadSearchInput(e.target.value);
                        fetchLeadsForSelect(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    {leadOptions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-40 overflow-y-auto divide-y divide-slate-100">
                        {leadOptions.map(l => (
                          <div
                            key={l._id}
                            onClick={() => {
                              setSelectedLeadObj(l);
                              setFormData(p => ({ ...p, client: l._id }));
                              setLeadOptions([]);
                            }}
                            className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-bold text-slate-800">{l.fullName}</span>
                            <span className="text-[10px] text-slate-400">{l.phone || l.email}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title Suggestions & Custom Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {TITLE_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, title: s }))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Josh about funding options"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900"
                />
              </div>

              {/* Follow-up Type & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Follow-up Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="call">Call 📞</option>
                    <option value="email">Email ✉️</option>
                    <option value="meeting">Meeting 📅</option>
                    <option value="whatsapp">WhatsApp 💬</option>
                    <option value="sms">SMS 📱</option>
                    <option value="task">General Task 📋</option>
                    <option value="note">Note 📝</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent 🔴</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Due Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Time</label>
                  <input
                    type="time"
                    required
                    value={formData.dueTime}
                    onChange={(e) => setFormData(p => ({ ...p, dueTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reminder & Repeat Options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reminder Alert</label>
                  <select
                    value={formData.reminderOption}
                    onChange={(e) => setFormData(p => ({ ...p, reminderOption: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="none">None</option>
                    <option value="5m">5 minutes before</option>
                    <option value="10m">10 minutes before</option>
                    <option value="15m">15 minutes before</option>
                    <option value="30m">30 minutes before</option>
                    <option value="1h">1 hour before</option>
                    <option value="2h">2 hours before</option>
                    <option value="1d">1 day before</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Repeat Task</label>
                  <select
                    value={formData.repeat}
                    onChange={(e) => setFormData(p => ({ ...p, repeat: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Action Details</label>
                <textarea
                  rows={3}
                  placeholder="Add optional notes, agenda items, or outcome expectations..."
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingReminder ? 'Update Follow-up' : 'Create Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLLOW-UP DETAIL DRAWER */}
      {selectedReminder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden animate-slide-in">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Task Details</span>
              <button onClick={() => setSelectedReminder(null)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Header Title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${PRIORITY_CONFIG[selectedReminder.priority]?.class}`}>
                    {selectedReminder.priority} Priority
                  </span>
                  {selectedReminder.isAutomated && (
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                      Automated Task ⚡
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">{selectedReminder.title}</h2>
              </div>

              {/* Connected Lead Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connected Lead</span>
                {selectedReminder.client ? (
                  <div>
                    <a
                      href={`/clients/${selectedReminder.client._id}`}
                      className="text-sm font-bold text-blue-600 hover:underline block"
                    >
                      {selectedReminder.client.fullName}
                    </a>
                    <p className="text-xs text-slate-600 mt-0.5">{selectedReminder.client.email || 'No email'}</p>
                    <p className="text-xs text-slate-600">{selectedReminder.client.phone || 'No phone'}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Lead unavailable (record removed)</p>
                )}
              </div>

              {/* Schedule Details */}
              <div className="grid grid-cols-2 gap-4 p-4 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Due Date & Time</span>
                  <span className="font-semibold text-slate-900 mt-1 block">
                    {format(new Date(selectedReminder.dueDate), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Agent</span>
                  <span className="font-semibold text-slate-900 mt-1 block">
                    {selectedReminder.assignedTo?.name || 'Assigned Agent'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedReminder.notes && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Notes / Instructions</h4>
                  <p className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-slate-700 leading-relaxed">
                    {selectedReminder.notes}
                  </p>
                </div>
              )}

              {/* Activity History Timeline */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Activity History</h4>
                <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                  {(selectedReminder.history || []).map((h, i) => (
                    <div key={i} className="relative pl-4">
                      <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                      <p className="font-semibold text-slate-800">{h.details || h.action}</p>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(h.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))}
                  {(!selectedReminder.history || selectedReminder.history.length === 0) && (
                    <p className="text-slate-400 text-xs italic">Task created</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              {!selectedReminder.isCompleted && selectedReminder.status !== 'completed' ? (
                <button
                  onClick={() => markComplete(selectedReminder._id)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-center"
                >
                  Mark Complete
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" /> Task Completed
                </span>
              )}

              <button
                onClick={() => handleDelete(selectedReminder._id)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
