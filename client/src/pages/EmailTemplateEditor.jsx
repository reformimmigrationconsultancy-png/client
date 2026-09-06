import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { 
  resolveVariables, 
  validateVariables, 
  getVariableDictionary, 
  SUPPORTED_VARIABLES, 
  SAMPLE_LEAD_DATA 
} from '../utils/variableResolver';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  SparklesIcon, 
  ComputerDesktopIcon, 
  DevicePhoneMobileIcon, 
  PaperAirplaneIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  'Welcome', 
  'Follow-up', 
  'Appointment', 
  'Reminder', 
  'Documents', 
  'Application', 
  'Re-engagement', 
  'General', 
  'Custom'
];

export default function EmailTemplateEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  // Form Fields (Raw template strings with {{placeholders}})
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Follow-up');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('active');

  // UI & Data States
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop | mobile

  // Dynamic Preview Lead Picker State
  const [leadList, setLeadList] = useState([]);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null); // null = Sample Mode
  const [isSearchingLeads, setIsSearchingLeads] = useState(false);

  // Test Email Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Active focus element for tag insertion
  const activeFocusRef = useRef('body'); // 'subject' | 'body'
  const subjectInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  useEffect(() => {
    fetchInitialLeads();
    if (isEditing) {
      fetchTemplateDetails();
    }
  }, [id]);

  const fetchInitialLeads = async (query = '') => {
    setIsSearchingLeads(true);
    try {
      const res = await api.get('/clients', { params: { search: query, limit: 20 } });
      const clients = res.data?.clients || res.data || [];
      if (Array.isArray(clients)) {
        setLeadList(clients);
        if (!selectedLead && clients.length > 0 && !query) {
          // Select the first lead by default for immediate real preview
          setSelectedLead(clients[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leads for editor preview:', err);
    } fontFinally: {
      setIsSearchingLeads(false);
    }
  };

  const fetchTemplateDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/email-templates/${id}`);
      const t = res.data?.template || res.data;
      setName(t.name || '');
      setCategory(t.category || 'General');
      setDescription(t.description || '');
      setSubject(t.subject || '');
      setBody(t.body || '');
      setStatus(t.status || 'active');
    } catch (err) {
      toast.error('Failed to load email template');
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  // Insert variable tag into subject or body at cursor
  const insertTag = (tag) => {
    if (activeFocusRef.current === 'subject' && subjectInputRef.current) {
      const input = subjectInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newSubject = subject.substring(0, start) + tag + subject.substring(end);
      setSubject(newSubject);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else if (bodyTextareaRef.current) {
      const textarea = bodyTextareaRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newBody = body.substring(0, start) + tag + body.substring(end);
      setBody(newBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    }
  };

  const handleSave = async (overrideStatus) => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject line is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Email body text is required');
      return;
    }

    const unsupportedSubjectVars = validateVariables(subject);
    const unsupportedBodyVars = validateVariables(body);
    const allUnsupported = Array.from(new Set([...unsupportedSubjectVars, ...unsupportedBodyVars]));

    if (allUnsupported.length > 0) {
      if (!window.confirm(`Warning: Found unsupported variable(s): ${allUnsupported.join(', ')}. Save anyway?`)) {
        return;
      }
    }

    const targetStatus = overrideStatus || status;
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim(),
        subject: subject.trim(),
        body: body.trim(),
        status: targetStatus
      };

      if (isEditing) {
        await api.put(`/email-templates/${id}`, payload);
        toast.success('Template updated successfully');
      } else {
        await api.post('/email-templates', payload);
        toast.success('Template created successfully');
      }
      navigate('/templates');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save template';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailRecipient.trim()) {
      toast.error('Enter recipient email address');
      return;
    }

    setSendingTest(true);
    try {
      await api.post('/email-templates/test-send', {
        recipientEmail: testEmailRecipient.trim(),
        subject,
        body,
        leadId: selectedLead?._id || null
      });
      toast.success(`Test email sent to ${testEmailRecipient}`);
      setShowTestModal(false);
      setTestEmailRecipient('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  // Determine active lead context for preview rendering (Real Lead vs Sample Lead Data)
  const activeLeadContext = selectedLead || SAMPLE_LEAD_DATA;
  const isRealLead = Boolean(selectedLead);

  // Resolved Subject & Body (for live preview frame only; editor inputs hold raw template)
  const renderedSubject = resolveVariables(subject, activeLeadContext);
  const renderedBody = resolveVariables(body, activeLeadContext);
  const variableDictionary = getVariableDictionary(activeLeadContext);

  // Health / Quality Diagnostics
  const getQualityDiagnostics = () => {
    const checks = [];

    // Subject length check
    if (!subject.trim()) {
      checks.push({ type: 'error', message: 'Subject line is empty.' });
    } else if (subject.length > 70) {
      checks.push({ type: 'warning', message: 'Subject exceeds 70 characters (may truncate on mobile).' });
    } else {
      checks.push({ type: 'success', message: 'Subject length optimal for high open rates.' });
    }

    // Body check
    if (!body.trim()) {
      checks.push({ type: 'error', message: 'Email body is empty.' });
    } else {
      const tagMatches = body.match(/\{\{[^}]+\}\}/g) || [];
      if (tagMatches.length === 0) {
        checks.push({ type: 'warning', message: 'No personalization tags used in body.' });
      } else {
        checks.push({ type: 'success', message: `Uses ${tagMatches.length} personalization variable tags.` });
      }
    }

    // Unsupported Variable Check
    const unsupportedSubjectVars = validateVariables(subject);
    const unsupportedBodyVars = validateVariables(body);
    const allUnsupported = Array.from(new Set([...unsupportedSubjectVars, ...unsupportedBodyVars]));

    if (allUnsupported.length > 0) {
      allUnsupported.forEach(varTag => {
        checks.push({ type: 'error', message: `Unsupported variable detected: ${varTag}` });
      });
    }

    return checks;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-xs font-medium text-slate-500">Loading template details...</p>
      </div>
    );
  }

  const diagnostics = getQualityDiagnostics();

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/templates')}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Back to Templates"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {isEditing ? `Edit: ${name || 'Untitled Template'}` : 'Create New Email Template'}
            </h1>
            <p className="text-xs text-slate-500">Design high-converting email templates with canonical variable replacement.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Switcher */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Test Send Button */}
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all"
          >
            <PaperAirplaneIcon className="w-3.5 h-3.5 -rotate-45" />
            Send Test
          </button>

          {/* Save Draft Button */}
          <button
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-lg transition-all"
          >
            Save Draft
          </button>

          {/* Save & Activate Button */}
          <button
            disabled={saving}
            onClick={() => handleSave('active')}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <CheckIcon className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Main 3-Panel Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* PANEL 1: METADATA & CATEGORIZED MERGE TAGS (3 cols) */}
        <div className="lg:col-span-3 border-r border-slate-200/80 bg-white p-5 overflow-y-auto space-y-6">
          
          {/* Metadata Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TagIcon className="w-4 h-4 text-blue-600" />
              Template Settings
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Template Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Follow-Up #1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description / Internal Note</label>
              <textarea
                rows={2}
                placeholder="Brief summary of when to send this template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none resize-none"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Categorized Merge Variable Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
                Merge Tags
              </h3>
              <span className="text-[10px] text-slate-400">Click to insert</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Click any variable to insert it into your active field (Subject or Email Body).
            </p>

            {['Lead', 'Assignment', 'CRM'].map(cat => (
              <div key={cat} className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{cat} Variables</span>
                {SUPPORTED_VARIABLES.filter(item => item.category === cat).map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertTag(item.tag)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-left transition-all group"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-mono font-bold text-blue-700 group-hover:text-blue-800 block">{item.tag}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{item.label}</span>
                    </div>
                    <span className="text-[10px] bg-white group-hover:bg-blue-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                      + Insert
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 2: SUBJECT & BODY CONTENT EDITOR (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-200/80 bg-white p-5 overflow-y-auto flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Content Editor</h2>
            <div className="text-[11px] text-slate-400 font-mono">
              Body: {body.length} chars | {body.trim() ? body.trim().split(/\s+/).length : 0} words
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-800">
                Email Subject Line <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${subject.length > 70 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                {subject.length}/70 chars
              </span>
            </div>
            <input
              ref={subjectInputRef}
              type="text"
              placeholder="e.g. Welcome {{first_name}} — thanks for your inquiry!"
              value={subject}
              onFocus={() => { activeFocusRef.current = 'subject'; }}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono"
            />
          </div>

          {/* Body Field */}
          <div className="flex-1 flex flex-col min-h-[360px]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800">
                Email Body Content <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Line breaks are preserved</span>
            </div>
            <textarea
              ref={bodyTextareaRef}
              placeholder={`Hello {{first_name}},\n\nThanks for reaching out to us. We received your inquiry regarding mortgage options.\n\nBest regards,\n{{admin_name}}`}
              value={body}
              onFocus={() => { activeFocusRef.current = 'body'; }}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* PANEL 3: LIVE PREVIEW & HEALTH DIAGNOSTICS (4 cols) */}
        <div className="lg:col-span-4 bg-[#f8fafc] p-5 overflow-y-auto space-y-5 flex flex-col">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Preview</h3>
              <p className="text-[10px] text-slate-500">Real-time dynamic rendering</p>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded transition-all ${previewDevice === 'desktop' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                title="Desktop View"
              >
                <ComputerDesktopIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded transition-all ${previewDevice === 'mobile' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                title="Mobile View"
              >
                <DevicePhoneMobileIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DYNAMIC LEAD PREVIEW SELECTOR */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                Preview Lead Context
              </label>

              {/* Status Badge */}
              {isRealLead ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  <CheckBadgeIcon className="w-3 h-3 text-emerald-500" />
                  REAL LEAD PREVIEW
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                  <InformationCircleIcon className="w-3 h-3 text-amber-500" />
                  SAMPLE RENDERING
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Search lead by name, email..."
                value={leadSearchQuery}
                onChange={(e) => {
                  setLeadSearchQuery(e.target.value);
                  fetchInitialLeads(e.target.value);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <select
                value={selectedLead?._id || ''}
                onChange={(e) => {
                  if (!e.target.value) {
                    setSelectedLead(null);
                  } else {
                    const found = leadList.find(l => l._id === e.target.value);
                    if (found) setSelectedLead(found);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="">-- Sample Lead --</option>
                {leadList.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.fullName || l.name} ({l.email || 'No email'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Container Frame */}
          <div className={`flex-1 transition-all ${previewDevice === 'mobile' ? 'max-w-[320px] mx-auto border-8 border-slate-800 rounded-3xl p-3 shadow-xl bg-white' : 'w-full border border-slate-200/80 rounded-xl bg-white shadow-sm'}`}>
            <div className="p-3 bg-slate-50 border-b border-slate-200/80 rounded-t-lg space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subject Line Preview:</div>
              <h4 className="font-bold text-slate-900 text-xs leading-snug">
                {renderedSubject || <span className="text-slate-300 italic">No subject line...</span>}
              </h4>
            </div>

            <div 
              className="p-4 text-slate-800 leading-relaxed text-xs space-y-2 font-sans overflow-x-auto min-h-[220px]"
              dangerouslySetInnerHTML={{
                __html: renderedBody.replace(/\n/g, '<br/>') || '<span className="text-slate-300 italic">Type content in the editor to view live rendered email preview...</span>'
              }}
            />
          </div>

          {/* Quality Diagnostics Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              Template Health & Diagnostics
            </h4>

            <div className="space-y-1.5">
              {diagnostics.map((diag, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {diag.type === 'error' && <ExclamationTriangleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                  {diag.type === 'warning' && <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                  {diag.type === 'success' && <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                  <span className={`${diag.type === 'error' ? 'text-rose-700 font-semibold' : diag.type === 'warning' ? 'text-amber-800' : 'text-slate-600'}`}>
                    {diag.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* TEST EMAIL DISPATCH MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Send Test Email</h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Dispatch a real test email rendered using lead context: <strong>{activeLeadContext.fullName || activeLeadContext.name}</strong>.
            </p>

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  {sendingTest ? 'Sending...' : (
                    <>
                      <PaperAirplaneIcon className="w-3.5 h-3.5 -rotate-45" />
                      Send Test Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
