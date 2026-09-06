import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  PlayIcon, 
  PauseIcon, 
  PlusIcon, 
  Cog6ToothIcon, 
  DocumentDuplicateIcon, 
  TrashIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  SparklesIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon, 
  ArrowPathIcon, 
  ChevronRightIcon, 
  EllipsisHorizontalIcon, 
  UserGroupIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ExclamationTriangleIcon, 
  PencilSquareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function Automations() {
  const navigate = useNavigate();

  // Data States
  const [automations, setAutomations] = useState([]);
  const [stats, setStats] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused, draft
  const [triggerFilter, setTriggerFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recently_updated');

  // Drawers & Detail Modals State
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [automationDetails, setAutomationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  useEffect(() => {
    fetchAutomationsAndStats();
    fetchActivityFeed();
  }, [search, statusFilter, triggerFilter, sortOrder]);

  const fetchAutomationsAndStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (triggerFilter !== 'all') params.trigger = triggerFilter;
      if (sortOrder) params.sort = sortOrder;

      try {
        const resAutomations = await api.get('/automations', { params });
        setAutomations(Array.isArray(resAutomations.data) ? resAutomations.data : []);
      } catch (err) {
        console.error('Automations list error:', err);
      }

      try {
        const resStats = await api.get('/automations/stats');
        setStats(resStats.data?.stats || null);
      } catch (err) {
        console.error('Automations stats error:', err);
      }
    } catch (err) {
      toast.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const res = await api.get('/automations/activity');
      setActivityFeed(res.data?.activity || []);
    } catch (err) {
      console.error('Activity feed error:', err);
    }
  };

  const handleToggleStatus = async (id, currentIsActive, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/automations/${id}`, { isActive: !currentIsActive });
      toast.success(currentIsActive ? 'Automation Paused' : 'Automation Activated');
      fetchAutomationsAndStats();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDuplicate = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/automations/${id}/duplicate`);
      toast.success('Automation duplicated as Draft');
      fetchAutomationsAndStats();
    } catch (err) {
      toast.error('Failed to duplicate automation');
    }
  };

  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete '${name}'? This will stop execution for all enrolled leads.`)) return;

    try {
      await api.delete(`/automations/${id}`);
      toast.success('Automation deleted');
      if (selectedAutomation?._id === id) setSelectedAutomation(null);
      fetchAutomationsAndStats();
    } catch (err) {
      toast.error('Failed to delete automation');
    }
  };

  const handleViewDetails = async (automation, e) => {
    if (e) e.stopPropagation();
    setSelectedAutomation(automation);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/automations/${automation._id}/details`);
      setAutomationDetails(res.data);
    } catch (err) {
      toast.error('Failed to load automation details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatTriggerLabel = (trigger, sourceCondition) => {
    let srcText = '';
    if (sourceCondition && sourceCondition !== 'all') {
      if (sourceCondition === 'facebook') srcText = ' (Meta Ads)';
      else if (sourceCondition === 'google') srcText = ' (Google Ads)';
      else if (sourceCondition === 'website') srcText = ' (Website)';
      else srcText = ` (${sourceCondition})`;
    }

    if (trigger === 'new_lead') return `New Lead Created${srcText}`;
    if (trigger === 'stage_changed') return `Lead Stage Changed${srcText}`;
    if (trigger === 'assigned') return `Lead Assigned${srcText}`;
    return `Manual / API${srcText}`;
  };

  const getStatusBadge = (isActive, status) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }
    if (status === 'paused') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <PauseIcon className="w-3 h-3" />
          Paused
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
        Draft
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Automation Center</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
              Workflow Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Automate lead follow-ups, welcome emails, and team tasks seamlessly.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/automations/new')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4" />
            Create Automation
          </button>
        </div>
      </div>

      {/* Real Summary Metric Cards */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div 
          onClick={() => setStatusFilter('active')} 
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all hover:shadow-md ${statusFilter === 'active' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>ACTIVE AUTOMATIONS</span>
            <SparklesIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats?.active ?? 0}</div>
          <span className="text-[11px] text-slate-400">Running workflows</span>
        </div>

        <div 
          onClick={() => setStatusFilter('paused')} 
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all hover:shadow-md ${statusFilter === 'paused' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>PAUSED</span>
            <PauseIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats?.paused ?? 0}</div>
          <span className="text-[11px] text-slate-400">Temporarily stopped</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>LEADS ENROLLED</span>
            <UserGroupIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats?.enrolled ?? 0}</div>
          <span className="text-[11px] text-slate-400">Currently in sequence</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>ACTIONS THIS WEEK</span>
            <ClockIcon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{stats?.actionsThisWeek ?? 0}</div>
          <span className="text-[11px] text-slate-400">Emails & tasks generated</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="px-6 py-2 bg-white border-y border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search automations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
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
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
            <option value="draft">Draft Only</option>
          </select>

          {/* Trigger Filter */}
          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Triggers</option>
            <option value="new_lead">New Lead Created</option>
            <option value="stage_changed">Stage Changed</option>
            <option value="assigned">Assigned</option>
          </select>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || triggerFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTriggerFilter('all');
                setSearch('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        <button
          onClick={() => setIsActivityOpen(prev => !prev)}
          className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ClockIcon className="w-4 h-4 text-slate-500" />
          {isActivityOpen ? 'Hide Activity Feed' : 'Live Activity Stream'}
        </button>
      </div>

      {/* Live Activity Feed Collapsible Banner */}
      {isActivityOpen && (
        <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 shrink-0 max-h-48 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Execution Activity Feed
            </span>
            <button onClick={() => setIsActivityOpen(false)} className="text-slate-400 hover:text-white">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5 text-xs">
            {activityFeed.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-slate-300">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="font-bold text-white">{item.automationName}</span>
                  <span className="text-slate-400">→</span>
                  <span>{item.details || item.action}</span>
                  {item.client && (
                    <a href={`/clients/${item.client._id}`} className="text-blue-400 hover:underline">
                      ({item.client.name})
                    </a>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {formatDistanceToNow(new Date(item.executedAt), { addSuffix: true })}
                </span>
              </div>
            ))}
            {activityFeed.length === 0 && (
              <p className="text-slate-500 italic text-xs">No recent execution activity logged yet.</p>
            )}
          </div>
        </div>
      )}

      {/* MAIN MANAGEMENT TABLE AREA */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
            <p className="text-xs font-medium">Loading CRM automations...</p>
          </div>
        ) : automations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-8 shadow-sm">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No automations found</h3>
            <p className="text-xs text-slate-500 mb-6">
              {search || statusFilter !== 'all' 
                ? 'No automations match your filter criteria.' 
                : 'Create your first workflow to automate lead follow-ups and emails.'}
            </p>
            <button
              onClick={() => navigate('/automations/new')}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Create Automation
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Automation</th>
                    <th className="py-3 px-4">Trigger</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Enrolled</th>
                    <th className="py-3 px-4">Steps</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {automations.map((auto) => {
                    const enrolledCount = auto.stats?.enrolled || 0;
                    const activeCount = auto.stats?.active || 0;
                    const stepCount = auto.steps?.length || 0;
                    const lastRunText = auto.stats?.lastActivityAt 
                      ? formatDistanceToNow(new Date(auto.stats.lastActivityAt), { addSuffix: true })
                      : 'Never';

                    return (
                      <tr
                        key={auto._id}
                        onClick={(e) => handleViewDetails(auto, e)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 max-w-[280px]">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                              <SparklesIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 hover:text-indigo-600 truncate">{auto.name}</h4>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{auto.description || 'Automated follow-up sequence'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {formatTriggerLabel(auto.trigger, auto.triggerConditions?.source)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(auto.isActive, auto.status)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900">{enrolledCount}</span>
                          <span className="text-slate-400 text-[11px] ml-1">({activeCount} active)</span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          {lastRunText}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active / Pause */}
                            <button
                              onClick={(e) => handleToggleStatus(auto._id, auto.isActive, e)}
                              className={`p-1.5 rounded-lg border transition-all ${auto.isActive ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'}`}
                              title={auto.isActive ? 'Pause Automation' : 'Activate Automation'}
                            >
                              {auto.isActive ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={(e) => handleDuplicate(auto._id, e)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                              title="Duplicate Automation"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => navigate(`/automations/${auto._id}/edit`)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                              title="Edit Automation Workflow"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={(e) => handleDelete(auto._id, auto.name, e)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                              title="Delete Automation"
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
      </div>

      {/* AUTOMATION DETAILS & ENROLLED LEADS SLIDE-OVER DRAWER */}
      {selectedAutomation && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden animate-slide-in">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Automation Details</span>
                <h2 className="text-base font-bold text-slate-900 leading-snug mt-0.5">{selectedAutomation.name}</h2>
              </div>
              <button onClick={() => setSelectedAutomation(null)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Trigger & Settings Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trigger Specification</span>
                  {getStatusBadge(selectedAutomation.isActive, selectedAutomation.status)}
                </div>
                <p className="font-semibold text-slate-800">
                  {formatTriggerLabel(selectedAutomation.trigger, selectedAutomation.triggerConditions?.source)}
                </p>
                {selectedAutomation.description && (
                  <p className="text-slate-500 italic">{selectedAutomation.description}</p>
                )}
              </div>

              {/* Visual Workflow Steps Preview */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Workflow Sequence ({selectedAutomation.steps?.length || 0} Steps)</h4>
                <div className="space-y-3 pl-3 border-l-2 border-indigo-200">
                  {selectedAutomation.steps?.map((step, index) => (
                    <div key={index} className="relative pl-4 bg-white p-3 border border-slate-200 rounded-lg shadow-xs">
                      <div className="absolute -left-[19px] top-3.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 capitalize">{step.order}. {step.action.replace('_', ' ')}</span>
                      </div>
                      {step.action === 'send_email' && (
                        <p className="text-[11px] text-slate-500 mt-1">Send Template ID: {step.config?.templateId || 'Welcome Email'}</p>
                      )}
                      {step.action === 'wait' && (
                        <p className="text-[11px] text-slate-500 mt-1">Delay: {step.config?.delayValue} {step.config?.delayUnit}</p>
                      )}
                      {step.action === 'create_task' && (
                        <p className="text-[11px] text-slate-500 mt-1">Task: "{step.config?.title}" (Due in {step.config?.dueInValue} {step.config?.dueInUnit})</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrolled Leads List */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">
                  Enrolled Leads ({automationDetails?.executions?.length || 0})
                </h4>
                {loadingDetails ? (
                  <p className="text-slate-400 text-xs animate-pulse">Loading enrolled leads...</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(automationDetails?.executions || []).map((exec) => (
                      <div key={exec._id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                        <div>
                          {exec.client ? (
                            <a href={`/clients/${exec.client._id}`} className="font-bold text-blue-600 hover:underline block">
                              {exec.client.fullName}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Lead record removed</span>
                          )}
                          <span className="text-[10px] text-slate-400">Step {exec.currentStepIndex + 1} of {selectedAutomation.steps?.length}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${exec.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {exec.status}
                        </span>
                      </div>
                    ))}
                    {(!automationDetails?.executions || automationDetails.executions.length === 0) && (
                      <p className="text-slate-400 text-xs italic">No leads currently enrolled in this sequence.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <button
                onClick={() => navigate(`/automations/${selectedAutomation._id}/edit`)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm text-center"
              >
                Edit Workflow
              </button>
              <button
                onClick={() => setSelectedAutomation(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
