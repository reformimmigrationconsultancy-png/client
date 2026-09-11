import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  PlayIcon, 
  PauseIcon, 
  PlusIcon, 
  DocumentDuplicateIcon, 
  TrashIcon, 
  ClockIcon, 
  SparklesIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  PencilSquareIcon,
  EyeIcon,
  BoltIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function Automations() {
  const navigate = useNavigate();

  // Active Main Tab: 'rules' | 'usage'
  const [activeTab, setActiveTab] = useState('rules');

  // Data States
  const [automations, setAutomations] = useState([]);
  const [stats, setStats] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused
  const [triggerFilter, setTriggerFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  // Drawers & Modals
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [automationDetails, setAutomationDetails] = useState(null);
  const [automationToDelete, setAutomationToDelete] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    fetchAutomationsAndStats();
    fetchActivityFeed();
  }, [search, statusFilter, triggerFilter, moduleFilter]);

  const fetchAutomationsAndStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (triggerFilter !== 'all') params.trigger = triggerFilter;

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
      toast.error('Failed to load workflow rules');
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
      toast.success(currentIsActive ? 'Workflow Rule Deactivated' : 'Workflow Rule Activated');
      fetchAutomationsAndStats();
    } catch (err) {
      toast.error('Failed to update workflow status');
    }
  };

  const handleDuplicate = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/automations/${id}/duplicate`);
      toast.success('Workflow Rule duplicated');
      fetchAutomationsAndStats();
    } catch (err) {
      toast.error('Failed to duplicate rule');
    }
  };

  const handleDelete = (auto, e) => {
    if (e) e.stopPropagation();
    setAutomationToDelete(auto);
  };

  const confirmDeleteAutomation = async () => {
    if (!automationToDelete) return;
    try {
      await api.delete(`/automations/${automationToDelete._id}`);
      toast.success(`Workflow rule '${automationToDelete.name}' deleted`);
      if (selectedAutomation?._id === automationToDelete._id) setSelectedAutomation(null);
      setAutomationToDelete(null);
      fetchAutomationsAndStats();
    } catch (err) {
      toast.error('Failed to delete rule: ' + (err.response?.data?.message || err.message));
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
      toast.error('Failed to load workflow details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatExecuteOn = (trigger, sourceCondition) => {
    let srcText = '';
    if (sourceCondition && sourceCondition !== 'all') {
      srcText = ` (${sourceCondition})`;
    }

    if (trigger === 'new_lead') return `Create${srcText}`;
    if (trigger === 'stage_changed') return `Create or Edit${srcText}`;
    if (trigger === 'assigned') return `Assignment${srcText}`;
    return `Create${srcText}`;
  };

  const formatModifiedDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* 1. TOP SUB-HEADER WITH MAIN TABS */}
      <div className="bg-white border-b border-slate-200 px-6 pt-5 pb-0 shrink-0 shadow-xs z-20">
        {/* Main Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workflow Rules</h1>
              <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                Automations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Workflow rules allow you to perform certain automatic actions on specific records based on filter criteria. Workflow automations can send emails, update fields, create records and much more.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/automations/new')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              <PlusIcon className="w-4 h-4" />
              Create Rule
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-8 border-b border-transparent">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'rules'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Rules ({automations.length})
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'usage'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Usage & Execution History
          </button>
        </div>
      </div>

      {/* 2. OPTIONAL PROMOTIONAL BANNER */}
      {showBanner && activeTab === 'rules' && (
        <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Smart CRM Workflows:</strong> Create rules to automatically assign tasks, send automated welcome emails, or move leads to contacted stage when created.
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-amber-700 hover:text-amber-950 font-bold ml-4 text-xs"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. TOOLBAR: SEARCH & FILTERS */}
      <div className="px-6 py-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search workflow rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-medium"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Modules</option>
            <option value="leads">Leads</option>
            <option value="deals">Deals / Pipeline</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="paused">Inactive Only</option>
          </select>

          {/* Trigger Filter */}
          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Triggers</option>
            <option value="new_lead">On Lead Create</option>
            <option value="stage_changed">On Stage Change</option>
            <option value="assigned">On Lead Assigned</option>
          </select>

          {(statusFilter !== 'all' || triggerFilter !== 'all' || moduleFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTriggerFilter('all');
                setModuleFilter('all');
                setSearch('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <strong>{automations.length}</strong> rules
        </div>
      </div>

      {/* 4. MAIN TAB CONTENTS */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {activeTab === 'rules' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
              <p className="text-xs font-medium">Loading workflow rules...</p>
            </div>
          ) : automations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                <BoltIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No workflow rules found</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {search || statusFilter !== 'all' 
                  ? 'No workflow rules match your search or filter options.' 
                  : 'Create your first workflow rule to perform automatic actions like sending emails or creating tasks.'}
              </p>
              <button
                onClick={() => navigate('/automations/new')}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
              >
                <PlusIcon className="w-4 h-4" />
                Create Rule
              </button>
            </div>
          ) : (
            /* WORKFLOW RULES TABLE (ZOHO STYLE) */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10">
                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      </th>
                      <th className="py-3 px-4">Rule Name</th>
                      <th className="py-3 px-4">Applies To</th>
                      <th className="py-3 px-4">Execute On</th>
                      <th className="py-3 px-4">Actions</th>
                      <th className="py-3 px-4">Modified On</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {automations.map((auto) => {
                      const stepCount = auto.steps?.length || 0;
                      const modifiedDate = formatModifiedDate(auto.updatedAt || auto.createdAt);

                      return (
                        <tr
                          key={auto._id}
                          onClick={(e) => handleViewDetails(auto, e)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                          </td>

                          {/* Rule Name */}
                          <td className="py-3.5 px-4 max-w-[280px]">
                            <div>
                              <span 
                                onClick={(e) => { e.stopPropagation(); navigate(`/automations/${auto._id}/edit`); }} 
                                className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline block truncate text-sm"
                              >
                                {auto.name}
                              </span>
                              {auto.description && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{auto.description}</p>
                              )}
                            </div>
                          </td>

                          {/* Applies To / Module */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Leads
                            </span>
                          </td>

                          {/* Execute On / Trigger */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-semibold">
                            {formatExecuteOn(auto.trigger, auto.triggerConditions?.source)}
                          </td>

                          {/* Actions Count */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-indigo-50/70 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              {stepCount} {stepCount === 1 ? 'action' : 'actions'}
                            </span>
                          </td>

                          {/* Modified On */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                            {modifiedDate}
                          </td>

                          {/* Status Toggle Switch */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleToggleStatus(auto._id, auto.isActive, e)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                auto.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={auto.isActive ? 'Deactivate Rule' : 'Activate Rule'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  auto.isActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Options / Row Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit */}
                              <button
                                onClick={() => navigate(`/automations/${auto._id}/edit`)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                                title="Edit Workflow Rule"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>

                              {/* Duplicate */}
                              <button
                                onClick={(e) => handleDuplicate(auto._id, e)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                                title="Duplicate Rule"
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={(e) => handleDelete(auto, e)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                                title="Delete Rule"
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
          )
        ) : (
          /* USAGE & EXECUTION HISTORY TAB */
          <div className="space-y-6">
            {/* Metric Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Rules</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{stats?.active ?? 0}</div>
                <span className="text-[11px] text-slate-400">Rules ready to trigger</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled Leads</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{stats?.enrolled ?? 0}</div>
                <span className="text-[11px] text-slate-400">Leads processed by rules</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions Executed This Week</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">{stats?.actionsThisWeek ?? 0}</div>
                <span className="text-[11px] text-slate-400">Automated emails & task logs</span>
              </div>
            </div>

            {/* Execution Stream Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-indigo-600" />
                Live Execution Logs
              </h3>

              <div className="space-y-3 text-xs">
                {activityFeed.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="font-bold text-slate-900">{item.automationName}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-700">{item.details || item.action}</span>
                      {item.client && (
                        <a href={`/clients/${item.client._id}`} className="text-indigo-600 font-semibold hover:underline">
                          ({item.client.name})
                        </a>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatDistanceToNow(new Date(item.executedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
                {activityFeed.length === 0 && (
                  <p className="text-slate-500 italic text-xs py-4 text-center">No execution log history recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WORKFLOW RULE DETAILS SLIDE-OVER DRAWER */}
      {selectedAutomation && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Workflow Details</span>
                <h2 className="text-base font-bold text-slate-900 leading-snug mt-0.5">{selectedAutomation.name}</h2>
              </div>
              <button onClick={() => setSelectedAutomation(null)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Trigger Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Execute On</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedAutomation.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {selectedAutomation.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  {formatExecuteOn(selectedAutomation.trigger, selectedAutomation.triggerConditions?.source)}
                </p>
                {selectedAutomation.description && (
                  <p className="text-slate-500 italic mt-1">{selectedAutomation.description}</p>
                )}
              </div>

              {/* Action Sequence */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Workflow Actions ({selectedAutomation.steps?.length || 0})</h4>
                <div className="space-y-3 pl-3 border-l-2 border-indigo-200">
                  {selectedAutomation.steps?.map((step, index) => (
                    <div key={index} className="relative pl-4 bg-white p-3 border border-slate-200 rounded-lg shadow-2xs">
                      <div className="absolute -left-[19px] top-3.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                      <div className="font-bold text-slate-900 capitalize">{step.order}. {step.action.replace('_', ' ')}</div>
                      {step.action === 'send_email' && (
                        <p className="text-[11px] text-slate-500 mt-1">Send Email Template</p>
                      )}
                      {step.action === 'wait' && (
                        <p className="text-[11px] text-slate-500 mt-1">Wait {step.config?.delayValue} {step.config?.delayUnit}</p>
                      )}
                      {step.action === 'create_task' && (
                        <p className="text-[11px] text-slate-500 mt-1">Create Task: "{step.config?.title}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <button
                onClick={() => navigate(`/automations/${selectedAutomation._id}/edit`)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs text-center"
              >
                Edit Rule
              </button>
              <button
                onClick={() => setSelectedAutomation(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {automationToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <TrashIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">Delete Workflow Rule?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">'{automationToDelete.name}'</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setAutomationToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAutomation}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-all"
              >
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
