import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  ArrowDownIcon, 
  PlusIcon, 
  TrashIcon, 
  PencilSquareIcon, 
  SparklesIcon, 
  EnvelopeIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XMarkIcon, 
  StopIcon, 
  FunnelIcon, 
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const VARIABLE_TAGS = [
  '{{fullName}}',
  '{{firstName}}',
  '{{lastName}}',
  '{{email}}',
  '{{phone}}',
  '{{source}}'
];

export default function AutomationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Automation Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('new_lead');
  const [triggerSource, setTriggerSource] = useState('all');
  const [stopOnReply, setStopOnReply] = useState(true);
  const [stopOnStages, setStopOnStages] = useState(['contacted', 'converted']);
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Email Templates for Selection
  const [templates, setTemplates] = useState([]);

  // Step Drawer / Modal State
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [activeStepData, setActiveStepData] = useState(null);

  // Activation Confirmation Modal
  const [showConfirmActivate, setShowConfirmActivate] = useState(false);

  useEffect(() => {
    fetchTemplates();
    if (isEditing) {
      fetchAutomationToEdit();
    }
  }, [id]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/email-templates');
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAutomationToEdit = async () => {
    try {
      const res = await api.get(`/automations/${id}`);
      const data = res.data;
      if (data) {
        setName(data.name || '');
        setDescription(data.description || '');
        setTrigger(data.trigger || 'new_lead');
        setTriggerSource(data.triggerConditions?.source || 'all');
        setStopOnReply(data.stopConditions?.stopOnReply ?? true);
        setStopOnStages(data.stopConditions?.stopOnStage || ['contacted', 'converted']);
        setSteps(data.steps || []);
      }
    } catch (err) {
      toast.error('Failed to load automation for editing');
      navigate('/automations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStepClick = (action) => {
    const defaultStep = {
      action,
      order: steps.length + 1,
      config: {}
    };

    if (action === 'send_email') {
      defaultStep.config = { templateId: templates[0]?._id || '', subjectOverride: '' };
    } else if (action === 'wait') {
      defaultStep.config = { delayValue: 1, delayUnit: 'days' };
    } else if (action === 'create_task') {
      defaultStep.config = { title: 'Follow up with {{firstName}}', dueInValue: 1, dueInUnit: 'days', priority: 'high', type: 'call' };
    } else if (action === 'change_stage') {
      defaultStep.config = { newStage: 'contacted' };
    }

    setEditingStepIndex(steps.length);
    setActiveStepData(defaultStep);
  };

  const handleEditStepClick = (index) => {
    setEditingStepIndex(index);
    setActiveStepData(JSON.parse(JSON.stringify(steps[index])));
  };

  const handleSaveStepModal = () => {
    if (!activeStepData) return;
    const newSteps = [...steps];

    if (editingStepIndex !== null && editingStepIndex < newSteps.length) {
      newSteps[editingStepIndex] = activeStepData;
    } else {
      newSteps.push(activeStepData);
    }

    // Re-index order
    newSteps.forEach((s, idx) => s.order = idx + 1);

    setSteps(newSteps);
    setEditingStepIndex(null);
    setActiveStepData(null);
  };

  const handleRemoveStep = (index, e) => {
    e.stopPropagation();
    const newSteps = steps.filter((_, i) => i !== index);
    newSteps.forEach((s, idx) => s.order = idx + 1);
    setSteps(newSteps);
  };

  const toggleStopStage = (stageKey) => {
    setStopOnStages(prev => 
      prev.includes(stageKey) ? prev.filter(s => s !== stageKey) : [...prev, stageKey]
    );
  };

  const handleSaveSubmit = async (activate = false) => {
    if (!name.trim()) {
      toast.error('Automation Name is required');
      return;
    }
    if (steps.length === 0) {
      toast.error('Add at least one workflow step action');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description,
        trigger,
        triggerConditions: { source: triggerSource },
        stopConditions: {
          stopOnReply,
          stopOnStage: stopOnStages
        },
        steps,
        isActive: activate
      };

      if (isEditing) {
        await api.put(`/automations/${id}`, payload);
        toast.success(activate ? 'Automation activated!' : 'Automation updated!');
      } else {
        await api.post('/automations', payload);
        toast.success(activate ? 'Automation activated!' : 'Automation saved as draft!');
      }

      navigate('/automations');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save automation');
    } finally {
      setSaving(false);
      setShowConfirmActivate(false);
    }
  };

  const getStepIcon = (action) => {
    if (action === 'send_email') return EnvelopeIcon;
    if (action === 'wait') return ClockIcon;
    if (action === 'create_task') return CheckCircleIcon;
    if (action === 'change_stage') return ArrowPathIcon;
    return StopIcon;
  };

  const getStepBadgeColor = (action) => {
    if (action === 'send_email') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action === 'wait') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action === 'create_task') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action === 'change_stage') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Top Action Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/automations')}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Automation Workflow' : 'Create Automation'}
            </h1>
            <p className="text-xs text-slate-500">Design your multi-step lead follow-up & email sequence.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveSubmit(false)}
            disabled={saving}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-xs transition-all"
          >
            Save as Draft
          </button>
          <button
            onClick={() => setShowConfirmActivate(true)}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
          >
            Save & Activate
          </button>
        </div>
      </div>

      {/* Main Flow Canvas Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 1. TRIGGER & WORKFLOW HEADER SPECIFICATION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4" />
                1. Automation Trigger & Overview
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Automation Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. New Meta Lead Welcome & 3-Day Follow-Up"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="Describe what this sequence accomplishes for your team..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trigger Event</label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-medium"
                >
                  <option value="new_lead">New Lead Created</option>
                  <option value="stage_changed">Stage Changed</option>
                  <option value="assigned">Assigned to Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lead Source Condition</label>
                <select
                  value={triggerSource}
                  onChange={(e) => setTriggerSource(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-medium"
                >
                  <option value="all">Any Source (All Leads)</option>
                  <option value="facebook">Meta Ads (Facebook / Instagram)</option>
                  <option value="google">Google Ads</option>
                  <option value="website">Website Form</option>
                </select>
              </div>
            </div>

            {/* Stop Conditions Card */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-600 block">Automatic Stop Conditions</span>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={stopOnReply}
                    onChange={(e) => setStopOnReply(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Stop automation if lead replies to email</span>
                </label>
              </div>
            </div>
          </div>

          {/* CONNECTING ARROW */}
          <div className="flex justify-center my-2 text-slate-300">
            <ArrowDownIcon className="w-5 h-5 animate-bounce" />
          </div>

          {/* 2. VISUAL VERTICAL STEP GRAPH */}
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const StepIcon = getStepIcon(step.action);
              const badgeClass = getStepBadgeColor(step.action);

              return (
                <React.Fragment key={idx}>
                  <div
                    onClick={() => handleEditStepClick(idx)}
                    className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${badgeClass}`}>
                          {step.action.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEditStepClick(idx)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveStep(idx, e)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step Description Preview */}
                    <div className="mt-3 text-xs text-slate-700 pl-10">
                      {step.action === 'send_email' && (
                        <div>
                          <span className="font-semibold text-slate-900">
                            Send Email: {templates.find(t => t._id === step.config?.templateId)?.name || 'Welcome Email'}
                          </span>
                          {step.config?.subjectOverride && (
                            <p className="text-slate-400 mt-0.5">Subject: "{step.config.subjectOverride}"</p>
                          )}
                        </div>
                      )}

                      {step.action === 'wait' && (
                        <p className="font-semibold text-amber-700">
                          Wait for {step.config?.delayValue || 1} {step.config?.delayUnit || 'days'} before next step
                        </p>
                      )}

                      {step.action === 'create_task' && (
                        <div>
                          <span className="font-semibold text-emerald-800">
                            Create Task: "{step.config?.title || 'Follow up'}"
                          </span>
                          <p className="text-slate-400 mt-0.5">
                            Due in {step.config?.dueInValue || 1} {step.config?.dueInUnit || 'days'} • Priority: {step.config?.priority || 'high'}
                          </p>
                        </div>
                      )}

                      {step.action === 'change_stage' && (
                        <p className="font-semibold text-purple-800">
                          Move Lead to Stage: <span className="capitalize">{(step.config?.newStage || 'contacted').replace('_', ' ')}</span>
                        </p>
                      )}

                      {step.action === 'stop' && (
                        <p className="font-semibold text-rose-800">Explicitly End Sequence</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center text-slate-300">
                    <ArrowDownIcon className="w-5 h-5" />
                  </div>
                </React.Fragment>
              );
            })}

            {/* ADD NEW STEP BUTTON CONTAINER */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                + Add Next Step Action
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddStepClick('send_email')}
                  className="px-3 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Send Email
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepClick('wait')}
                  className="px-3 py-2 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <ClockIcon className="w-4 h-4" />
                  Wait / Delay
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepClick('create_task')}
                  className="px-3 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Create Task
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepClick('change_stage')}
                  className="px-3 py-2 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Change Stage
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStepClick('stop')}
                  className="px-3 py-2 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <StopIcon className="w-4 h-4" />
                  Stop Sequence
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP CONFIGURATION MODAL */}
      {activeStepData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Configure Step Action: {activeStepData.action.replace('_', ' ')}
              </h3>
              <button
                onClick={() => { setEditingStepIndex(null); setActiveStepData(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* Variable Suggestion Pills */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Insert Dynamic Tags</span>
                <div className="flex flex-wrap gap-1">
                  {VARIABLE_TAGS.map(tag => (
                    <span
                      key={tag}
                      onClick={() => {
                        if (activeStepData.action === 'create_task') {
                          setActiveStepData(prev => ({
                            ...prev,
                            config: { ...prev.config, title: (prev.config.title || '') + ' ' + tag }
                          }));
                        }
                      }}
                      className="cursor-pointer bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* SEND EMAIL CONFIG */}
              {activeStepData.action === 'send_email' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Template</label>
                    <select
                      value={activeStepData.config?.templateId || ''}
                      onChange={(e) => setActiveStepData(prev => ({
                        ...prev,
                        config: { ...prev.config, templateId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select an Email Template...</option>
                      {templates.map(t => (
                        <option key={t._id} value={t._id}>{t.name} ({t.category || 'General'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subject Line (Optional Override)</label>
                    <input
                      type="text"
                      placeholder="e.g. Welcome {{firstName}}, let's get started!"
                      value={activeStepData.config?.subjectOverride || ''}
                      onChange={(e) => setActiveStepData(prev => ({
                        ...prev,
                        config: { ...prev.config, subjectOverride: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* WAIT DELAY CONFIG */}
              {activeStepData.action === 'wait' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delay Value</label>
                    <input
                      type="number"
                      min="1"
                      value={activeStepData.config?.delayValue || 1}
                      onChange={(e) => setActiveStepData(prev => ({
                        ...prev,
                        config: { ...prev.config, delayValue: parseInt(e.target.value) || 1 }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Delay Unit</label>
                    <select
                      value={activeStepData.config?.delayUnit || 'days'}
                      onChange={(e) => setActiveStepData(prev => ({
                        ...prev,
                        config: { ...prev.config, delayUnit: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}

              {/* CREATE TASK CONFIG */}
              {activeStepData.action === 'create_task' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Task Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Call {{firstName}} to discuss application"
                      value={activeStepData.config?.title || ''}
                      onChange={(e) => setActiveStepData(prev => ({
                        ...prev,
                        config: { ...prev.config, title: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Due Offset Value</label>
                      <input
                        type="number"
                        min="1"
                        value={activeStepData.config?.dueInValue || 1}
                        onChange={(e) => setActiveStepData(prev => ({
                          ...prev,
                          config: { ...prev.config, dueInValue: parseInt(e.target.value) || 1 }
                        }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Due Offset Unit</label>
                      <select
                        value={activeStepData.config?.dueInUnit || 'days'}
                        onChange={(e) => setActiveStepData(prev => ({
                          ...prev,
                          config: { ...prev.config, dueInUnit: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Task Priority</label>
                    <select
                      value={activeStepData.config?.priority || 'high'}
                      onChange={(e) => setActiveStepData(prev => ({
                        ...prev,
                        config: { ...prev.config, priority: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              )}

              {/* CHANGE STAGE CONFIG */}
              {activeStepData.action === 'change_stage' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Lead Stage</label>
                  <select
                    value={activeStepData.config?.newStage || 'contacted'}
                    onChange={(e) => setActiveStepData(prev => ({
                      ...prev,
                      config: { ...prev.config, newStage: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 capitalize"
                  >
                    <option value="new_lead">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="documents_received">Documents Received</option>
                    <option value="approved">Approved</option>
                    <option value="closed">Closed / Won</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditingStepIndex(null); setActiveStepData(null); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStepModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Save Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVATION CONFIRMATION MODAL */}
      {showConfirmActivate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Activate Automation?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are about to activate <strong>"{name || 'Untitled Automation'}"</strong> with {steps.length} workflow steps.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowConfirmActivate(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveSubmit(true)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-sm"
              >
                Activate Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
