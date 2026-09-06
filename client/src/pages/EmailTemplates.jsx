import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  EnvelopeIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  DocumentDuplicateIcon, 
  PaperAirplaneIcon, 
  EyeIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  SparklesIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  FunnelIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const CATEGORY_COLORS = {
  Welcome: 'bg-blue-50 text-blue-700 border-blue-200',
  'Follow-up': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Appointment: 'bg-purple-50 text-purple-700 border-purple-200',
  Reminder: 'bg-amber-50 text-amber-700 border-amber-200',
  Documents: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Application: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Re-engagement': 'bg-rose-50 text-rose-700 border-rose-200',
  General: 'bg-slate-100 text-slate-700 border-slate-200',
  Custom: 'bg-violet-50 text-violet-700 border-violet-200'
};

export default function EmailTemplates() {
  const navigate = useNavigate();

  // Data States
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recently_updated');

  // Preview & Test Send Drawer State
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop | mobile
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchTemplatesAndStats();
  }, [search, categoryFilter, statusFilter, sortOrder]);

  const fetchTemplatesAndStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (sortOrder) params.sort = sortOrder;

      try {
        const resTemplates = await api.get('/email-templates', { params });
        setTemplates(Array.isArray(resTemplates.data) ? resTemplates.data : []);
      } catch (err) {
        console.error('Templates list fetch error:', err);
      }

      try {
        const resStats = await api.get('/email-templates/stats');
        setStats(resStats.data?.stats || null);
      } catch (err) {
        console.error('Templates stats fetch error:', err);
      }
    } catch (err) {
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/email-templates/${id}/duplicate`);
      toast.success('Template duplicated');
      fetchTemplatesAndStats();
    } catch (err) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleDelete = async (template, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete '${template.name}'?`)) return;

    try {
      await api.delete(`/email-templates/${template._id}`);
      toast.success('Template deleted');
      if (previewTemplate?._id === template._id) setPreviewTemplate(null);
      fetchTemplatesAndStats();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete template';
      toast.error(msg);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) {
      toast.error('Enter a test recipient email address');
      return;
    }
    if (!previewTemplate) return;

    setSendingTest(true);
    try {
      await api.post('/email-templates/test-send', {
        recipientEmail: testEmailAddress,
        subject: previewTemplate.subject,
        body: previewTemplate.body
      });
      toast.success(`Test email sent to ${testEmailAddress}`);
      setTestEmailAddress('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }
    if (status === 'archived') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Archived
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Email Template Center</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              Commercial CRM
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Create, personalize, and reuse email templates across your CRM automations and outreach.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/templates/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Real Summary Metric Cards */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>TOTAL TEMPLATES</span>
            <EnvelopeIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.total ?? templates.length}</div>
          <span className="text-[11px] text-slate-400">Available templates</span>
        </div>

        <div 
          onClick={() => setStatusFilter('active')}
          className={`cursor-pointer bg-white p-3.5 rounded-xl border transition-all hover:shadow-md ${statusFilter === 'active' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'}`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>ACTIVE TEMPLATES</span>
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats?.active ?? 0}</div>
          <span className="text-[11px] text-slate-400">Ready to send</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>IN AUTOMATIONS</span>
            <SparklesIcon className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 mt-1">{stats?.usedInAutomations ?? 0}</div>
          <span className="text-[11px] text-slate-400">Linked to sequences</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>USED THIS MONTH</span>
            <ClockIcon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{stats?.usedThisMonth ?? 0}</div>
          <span className="text-[11px] text-slate-400">Dispatched in campaigns</span>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="px-6 py-2 bg-white border-y border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, subject, category..."
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {['all', 'Welcome', 'Follow-up', 'Appointment', 'Reminder', 'Documents', 'Re-engagement', 'General'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recently_updated">Recently Updated</option>
            <option value="recently_created">Recently Created</option>
            <option value="name_asc">Name A-Z</option>
            <option value="most_used">Most Used</option>
          </select>

          {/* Clear Filters */}
          {(categoryFilter !== 'all' || statusFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setStatusFilter('all');
                setSearch('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* MAIN MANAGEMENT TABLE AREA */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-xs font-medium">Loading email templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-8 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <EnvelopeIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No email templates found</h3>
            <p className="text-xs text-slate-500 mb-6">
              {search || categoryFilter !== 'all' 
                ? 'No templates match your filter criteria.' 
                : 'Create your first email template to use in automations and direct communications.'}
            </p>
            <button
              onClick={() => navigate('/templates/new')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Create Template
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Template</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Subject Preview</th>
                    <th className="py-3 px-4">Used In</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {templates.map((template) => {
                    const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.General;
                    const usedInList = template.usedInAutomations || [];
                    const updatedText = template.updatedAt 
                      ? formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })
                      : 'Recently';

                    return (
                      <tr
                        key={template._id}
                        onClick={() => setPreviewTemplate(template)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 max-w-[280px]">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                              <EnvelopeIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 hover:text-blue-600 truncate">{template.name}</h4>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{template.description || 'No description provided'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${catColor}`}>
                            {template.category || 'General'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-[260px]">
                          <p className="font-medium text-slate-800 truncate">{template.subject}</p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {usedInList.length > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                              <SparklesIcon className="w-3 h-3 text-purple-500" />
                              {usedInList.length} {usedInList.length === 1 ? 'automation' : 'automations'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Manual only</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          {updatedText}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(template.status)}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview */}
                            <button
                              onClick={() => setPreviewTemplate(template)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                              title="Preview Template"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => navigate(`/templates/${template._id}/edit`)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                              title="Edit Template"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={(e) => handleDuplicate(template._id, e)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                              title="Duplicate Template"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={(e) => handleDelete(template, e)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                              title="Delete Template"
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

      {/* TEMPLATE LIVE PREVIEW & TEST SEND SLIDE-OVER DRAWER */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden animate-slide-in">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Email Preview & Test Send</span>
                <h2 className="text-base font-bold text-slate-900 leading-snug mt-0.5">{previewTemplate.name}</h2>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Preview Controls Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    <ComputerDesktopIcon className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    <DevicePhoneMobileIcon className="w-3.5 h-3.5" />
                    Mobile
                  </button>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${CATEGORY_COLORS[previewTemplate.category] || CATEGORY_COLORS.General}`}>
                  {previewTemplate.category}
                </span>
              </div>

              {/* Rendered Email Frame */}
              <div className={`mx-auto transition-all ${previewDevice === 'mobile' ? 'max-w-[340px] border-8 border-slate-800 rounded-3xl p-3 shadow-xl bg-white' : 'w-full border border-slate-200 rounded-xl bg-white shadow-sm'}`}>
                <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Subject:</span>
                    <span className="text-[10px] text-slate-400">Sample Rendering</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {previewTemplate.subject.replace(/\{\{fullName\}\}/g, 'Josh Dasilva').replace(/\{\{firstName\}\}/g, 'Josh')}
                  </h3>
                </div>

                <div 
                  className="p-6 text-slate-800 leading-relaxed text-sm bg-white space-y-2 font-sans overflow-x-auto min-h-[220px]"
                  dangerouslySetInnerHTML={{
                    __html: previewTemplate.body
                      .replace(/\{\{fullName\}\}/g, 'Josh Dasilva')
                      .replace(/\{\{first_name\}\}/g, 'Josh')
                      .replace(/\{\{firstName\}\}/g, 'Josh')
                      .replace(/\{\{phone\}\}/g, '+1 (705) 555-0192')
                      .replace(/\{\{email\}\}/g, 'josh.dasilva@example.com')
                      .replace(/\{\{admin_name\}\}/g, 'Manpreet Singh')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>

              {/* Test Email Dispatch Form */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Send Test Email</span>
                <p className="text-[11px] text-slate-500">Safely send a test email to your inbox before publishing to automations.</p>

                <form onSubmit={handleSendTestEmail} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter test recipient email..."
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    {sendingTest ? 'Sending...' : (
                      <>
                        <PaperAirplaneIcon className="w-3.5 h-3.5 -rotate-45" />
                        Send Test
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <button
                onClick={() => navigate(`/templates/${previewTemplate._id}/edit`)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm text-center"
              >
                Edit Template
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
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
