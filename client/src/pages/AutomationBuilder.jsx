import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  PencilSquareIcon, 
  SparklesIcon, 
  EnvelopeIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XMarkIcon, 
  StopIcon, 
  ArrowPathIcon,
  CheckIcon,
  BoltIcon,
  FunnelIcon,
  InformationCircleIcon
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

  // Workflow Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('new_lead');
  const [triggerSource, setTriggerSource] = useState('all');
  const [isActive, setIsActive] = useState(true);
  const [stopOnReply, setStopOnReply] = useState(true);
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Email Templates List
  const [templates, setTemplates] = useState([]);

  // Step Editing Drawer/Modal State
  const [activeModal, setActiveModal] = useState(null); // 'action' | 'condition' | null
  const [actionCategory, setActionCategory] = useState('instant'); // 'instant' | 'scheduled'
  const [scheduledDelayValue, setScheduledDelayValue] = useState(4);
  const [scheduledDelayUnit, setScheduledDelayUnit] = useState('days');

  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [stepData, setStepData] = useState({
    action: 'send_email',
    config: {}
  });

  useEffect(() => {
    fetchTemplates();
    if (isEditing) {
      fetchAutomationToEdit();
    } else {
      // Default initial steps demo
      setName('Ways To PR');
      setDescription('Automated lead follow-up & email sequence');
      setSteps([
        { order: 1, action: 'send_email', isScheduled: false, config: { templateId: '', subjectOverride: 'Welcome Emailer 1' } },
        { order: 2, action: 'wait', isScheduled: true, config: { delayValue: 4, delayUnit: 'days' } },
        { order: 3, action: 'send_email', isScheduled: true, config: { templateId: '', subjectOverride: 'Follow-up Emailer 2' } },
        { order: 4, action: 'wait', isScheduled: true, config: { delayValue: 7, delayUnit: 'days' } },
        { order: 5, action: 'send_email', isScheduled: true, config: { templateId: '', subjectOverride: 'Final Emailer 3' } }
      ]);
    }
  }, [id]);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/email-templates');
      const tmpls = Array.isArray(res.data) ? res.data : [];
      setTemplates(tmpls);
    } catch (err) {
      console.error('Error fetching email templates:', err);
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
        setIsActive(Boolean(data.isActive));
        setStopOnReply(data.stopConditions?.stopOnReply ?? true);
        setSteps(data.steps || []);
      }
    } catch (err) {
      toast.error('Failed to load workflow rule');
      navigate('/automations');
    } finally {
      setLoading(false);
    }
  };

  // Open modal to add action
  const handleOpenAddAction = (category) => {
    setActionCategory(category);
    setEditingStepIndex(null);
    setStepData({
      action: 'send_email',
      config: {
        templateId: templates[0]?._id || '',
        subjectOverride: '',
        title: 'Follow up call with {{firstName}}',
        dueInValue: 1,
        dueInUnit: 'days',
        priority: 'high',
        newStage: 'contacted'
      }
    });
    setActiveModal('action');
  };

  // Open modal to edit existing step
  const handleEditStep = (index) => {
    setEditingStepIndex(index);
    const existing = steps[index];
    setStepData(JSON.parse(JSON.stringify(existing)));
    setActiveModal('action');
  };

  // Save Step Action from modal
  const handleSaveStepModal = () => {
    const newSteps = [...steps];

    if (editingStepIndex !== null && editingStepIndex < newSteps.length) {
      newSteps[editingStepIndex] = stepData;
    } else {
      if (actionCategory === 'scheduled') {
        // If scheduled and no wait step exists before, add a wait step first
        newSteps.push({
          action: 'wait',
          isScheduled: true,
          config: { delayValue: scheduledDelayValue, delayUnit: scheduledDelayUnit }
        });
      }
      newSteps.push({
        ...stepData,
        isScheduled: actionCategory === 'scheduled'
      });
    }

    // Re-index order
    newSteps.forEach((s, idx) => s.order = idx + 1);

    setSteps(newSteps);
    setActiveModal(null);
    setEditingStepIndex(null);
  };

  const handleRemoveStep = (index, e) => {
    if (e) e.stopPropagation();
    const newSteps = steps.filter((_, i) => i !== index);
    newSteps.forEach((s, idx) => s.order = idx + 1);
    setSteps(newSteps);
  };

  const handleSaveSubmit = async (activeState = isActive) => {
    if (!name.trim()) {
      toast.error('Workflow Rule Name is required');
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
          stopOnReply
        },
        steps,
        isActive: activeState
      };

      if (isEditing) {
        await api.put(`/automations/${id}`, payload);
        toast.success(activeState ? 'Workflow Rule activated & saved!' : 'Workflow Rule updated!');
      } else {
        await api.post('/automations', payload);
        toast.success(activeState ? 'Workflow Rule created & activated!' : 'Workflow Rule saved as draft!');
      }

      navigate('/automations');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save workflow rule');
    } finally {
      setSaving(false);
    }
  };

  // Split steps into Instant vs Scheduled Actions for rendering
  const instantSteps = steps.filter(s => s.action !== 'wait' && !s.isScheduled);
  
  // Group scheduled steps by wait/delays
  const scheduledBlocks = [];
  let currentBlock = null;
  steps.forEach((s) => {
    if (s.action === 'wait') {
      if (currentBlock) scheduledBlocks.push(currentBlock);
      currentBlock = {
        delayValue: s.config?.delayValue || 1,
        delayUnit: s.config?.delayUnit || 'days',
        actions: []
      };
    } else if (s.isScheduled || currentBlock) {
      if (!currentBlock) {
        currentBlock = { delayValue: 4, delayUnit: 'days', actions: [] };
      }
      currentBlock.actions.push(s);
    }
  });
  if (currentBlock) scheduledBlocks.push(currentBlock);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden font-sans">
      {/* 1. TOP HEADER (ZOHO CRM FLOWCHART HEADER STYLE) */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/automations')}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Back to Workflow Rules"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rule Name (e.g. Ways To PR)"
                className="text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-300"
              />
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                @ Leads
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pl-1.5 mt-0.5">
              {description || 'Workflow automation rule sequence'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Status: <strong className={isActive ? 'text-emerald-600' : 'text-slate-500'}>{isActive ? 'Active' : 'Draft'}</strong>
          </span>

          <button
            onClick={() => {
              const newState = !isActive;
              setIsActive(newState);
              if (isEditing) handleSaveSubmit(newState);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              isActive 
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>

          <button
            onClick={() => handleSaveSubmit(false)}
            disabled={saving}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all"
          >
            Save Draft
          </button>

          <button
            onClick={() => handleSaveSubmit(true)}
            disabled={saving}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all active:scale-[0.98]"
          >
            Save Rule
          </button>
        </div>
      </div>

      {/* 2. VISUAL FLOWCHART CANVAS */}
      <div className="flex-1 overflow-y-auto p-8 relative min-h-0 bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          {/* ==================== NODE 1: WHEN ==================== */}
          <div className="flex items-center gap-6 w-full max-w-2xl relative">
            {/* Circle Badge WHEN */}
            <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-lg border-4 border-white z-10">
              WHEN
            </div>

            {/* Horizontal Line Connector */}
            <div className="h-0.5 bg-indigo-400 flex-1 max-w-[40px]" />

            {/* WHEN Trigger Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-1 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Rule Trigger Event</span>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="new_lead">Lead Created</option>
                  <option value="stage_changed">Stage Changed</option>
                  <option value="assigned">Assigned to Agent</option>
                </select>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                This rule will be executed when a lead is <strong className="text-indigo-600">{trigger === 'new_lead' ? 'created' : trigger === 'stage_changed' ? 'updated in stage' : 'assigned'}</strong>.
              </p>
            </div>
          </div>

          {/* Vertical Connecting Line down to Condition */}
          <div className="w-0.5 h-10 bg-indigo-400 my-1" />

          {/* ==================== NODE 2: CONDITION ==================== */}
          <div className="flex items-center gap-6 w-full max-w-2xl relative">
            {/* Diamond Badge CONDITION */}
            <div className="w-16 h-16 bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-lg border-4 border-white z-10 rotate-45 transform">
              <span className="-rotate-45 text-center leading-tight">CONDITION<br/>1</span>
            </div>

            {/* Horizontal Line Connector */}
            <div className="h-0.5 bg-indigo-400 flex-1 max-w-[40px]" />

            {/* Condition Criteria Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-1 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Criteria Filter</span>
                <select
                  value={triggerSource}
                  onChange={(e) => setTriggerSource(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700"
                >
                  <option value="all">Any Source (All Leads)</option>
                  <option value="facebook">Meta Ads (Facebook / Instagram)</option>
                  <option value="google">Google Ads</option>
                  <option value="website">Website Form</option>
                </select>
              </div>

              <div className="space-y-1 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                <div>1. Lead Source is <span className="font-bold text-indigo-700">{triggerSource.toUpperCase()}</span></div>
                <div className="text-[10px] text-slate-400 font-sans mt-1">Criteria Pattern: (1 Match)</div>
              </div>
            </div>
          </div>

          {/* Vertical Connecting Line down to Actions Branch */}
          <div className="w-0.5 h-12 bg-indigo-400 my-1" />

          {/* ==================== NODE 3: ACTION BRANCHES ==================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            
            {/* INSTANT ACTIONS COLUMN */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <BoltIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Instant Actions</h3>
                    <p className="text-[10px] text-slate-400">Executed immediately on trigger</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddAction('instant')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Action
                </button>
              </div>

              {/* Instant Action Items List */}
              <div className="space-y-3 flex-1">
                {instantSteps.map((step, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleEditStep(steps.indexOf(step))}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                        {step.action.replace('_', ' ')}
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {step.action === 'send_email' && (step.config?.subjectOverride || 'Email Notification: Emailer 1')}
                        {step.action === 'create_task' && (`Create Task: ${step.config?.title}`)}
                        {step.action === 'change_stage' && (`Move to Stage: ${step.config?.newStage}`)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditStep(steps.indexOf(step))} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => handleRemoveStep(steps.indexOf(step), e)} className="p-1 text-rose-600 hover:bg-rose-100 rounded">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {instantSteps.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
                    No instant actions configured. Click + Action to add one.
                  </p>
                )}
              </div>
            </div>

            {/* SCHEDULED ACTIONS COLUMN */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                    <ClockIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Scheduled Actions</h3>
                    <p className="text-[10px] text-slate-400">Executed after specific time delay</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddAction('scheduled')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Action
                </button>
              </div>

              {/* Scheduled Action Blocks List */}
              <div className="space-y-4 flex-1">
                {scheduledBlocks.map((block, bIdx) => (
                  <div key={bIdx} className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 space-y-2">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5 text-indigo-600" />
                      Execute {block.delayValue} {block.delayUnit} After Rule Trigger Time
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-indigo-300">
                      {block.actions.map((step, aIdx) => (
                        <div
                          key={aIdx}
                          onClick={() => handleEditStep(steps.indexOf(step))}
                          className="p-2.5 bg-white border border-slate-200 rounded-md cursor-pointer hover:border-indigo-300 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                              {step.action.replace('_', ' ')}
                            </span>
                            <p className="text-xs font-semibold text-slate-800">
                              {step.action === 'send_email' && (step.config?.subjectOverride || `Email Notification: Emailer ${bIdx + 2}`)}
                              {step.action === 'create_task' && (`Task: ${step.config?.title}`)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditStep(steps.indexOf(step))} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => handleRemoveStep(steps.indexOf(step), e)} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {scheduledBlocks.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
                    No scheduled delays configured. Click + Action to set scheduled follow-ups.
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 3. STEP ACTION CONFIGURATION MODAL */}
      {activeModal === 'action' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {editingStepIndex !== null ? 'Edit Workflow Action' : `Add ${actionCategory === 'instant' ? 'Instant' : 'Scheduled'} Action`}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* Scheduled Delay Inputs if category is scheduled */}
              {actionCategory === 'scheduled' && editingStepIndex === null && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                  <label className="block font-bold text-indigo-900 text-xs">Execute Delay</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      value={scheduledDelayValue}
                      onChange={(e) => setScheduledDelayValue(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg font-bold text-slate-900"
                    />
                    <select
                      value={scheduledDelayUnit}
                      onChange={(e) => setScheduledDelayUnit(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg font-semibold text-slate-800"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Type Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Action Type</label>
                <select
                  value={stepData.action}
                  onChange={(e) => setStepData(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="send_email">Send Email Notification</option>
                  <option value="create_task">Create Follow-up Task</option>
                  <option value="change_stage">Update Lead Stage</option>
                </select>
              </div>

              {/* Dynamic Variables helper */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Dynamic Tags</span>
                <div className="flex flex-wrap gap-1">
                  {VARIABLE_TAGS.map(tag => (
                    <span
                      key={tag}
                      onClick={() => {
                        if (stepData.action === 'create_task') {
                          setStepData(prev => ({ ...prev, config: { ...prev.config, title: (prev.config?.title || '') + ' ' + tag } }));
                        } else if (stepData.action === 'send_email') {
                          setStepData(prev => ({ ...prev, config: { ...prev.config, subjectOverride: (prev.config?.subjectOverride || '') + ' ' + tag } }));
                        }
                      }}
                      className="cursor-pointer bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* EMAIL CONFIG */}
              {stepData.action === 'send_email' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Template</label>
                    <select
                      value={stepData.config?.templateId || ''}
                      onChange={(e) => setStepData(prev => ({ ...prev, config: { ...prev.config, templateId: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="">Select Email Template...</option>
                      {templates.map(t => (
                        <option key={t._id} value={t._id}>{t.name} ({t.category || 'General'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subject / Label Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Emailer 1 (Welcome {{firstName}})"
                      value={stepData.config?.subjectOverride || ''}
                      onChange={(e) => setStepData(prev => ({ ...prev, config: { ...prev.config, subjectOverride: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                </div>
              )}

              {/* TASK CONFIG */}
              {stepData.action === 'create_task' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Task Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Call {{firstName}} to qualify requirements"
                      value={stepData.config?.title || ''}
                      onChange={(e) => setStepData(prev => ({ ...prev, config: { ...prev.config, title: e.target.value } }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                    />
                  </div>
                </div>
              )}

              {/* STAGE CONFIG */}
              {stepData.action === 'change_stage' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Stage</label>
                  <select
                    value={stepData.config?.newStage || 'contacted'}
                    onChange={(e) => setStepData(prev => ({ ...prev, config: { ...prev.config, newStage: e.target.value } }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium capitalize"
                  >
                    <option value="new_lead">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="closed">Closed / Won</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStepModal}
                className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm text-xs"
              >
                Save Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
