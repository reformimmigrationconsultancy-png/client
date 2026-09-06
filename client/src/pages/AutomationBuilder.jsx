import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { ArrowDownIcon as ArrowDown, PlusIcon as Plus, TrashIcon as Trash } from '@heroicons/react/24/outline';

const AutomationBuilder = () => {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('new_lead');
  const [triggerSource, setTriggerSource] = useState('all');
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);

  // Hardcoded templates for demo if endpoint not available, but should fetch
  // For simplicity in this UI, we will just use basic text input for config if templates are not loaded yet
  const [templates, setTemplates] = useState([]);
  
  React.useEffect(() => {
    api.get('/email-templates').then(res => setTemplates(res.data)).catch(console.error);
  }, []);

  const addStep = (action) => {
    const newStep = { action, order: steps.length + 1, config: {} };
    if (action === 'wait') {
      newStep.config = { delayValue: 1, delayUnit: 'days' };
    }
    if (action === 'create_task') {
      newStep.config = { title: 'Follow up', dueInValue: 1, dueInUnit: 'days', priority: 'medium' };
    }
    setSteps([...steps, newStep]);
  };

  const removeStep = (index) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    // Re-order
    newSteps.forEach((s, i) => s.order = i + 1);
    setSteps(newSteps);
  };

  const updateStepConfig = (index, key, value) => {
    const newSteps = [...steps];
    newSteps[index].config[key] = value;
    setSteps(newSteps);
  };

  const handleSave = async (activate = false) => {
    if (!name.trim()) return toast.error('Name is required');
    if (steps.length === 0) return toast.error('Add at least one action');

    setSaving(true);
    try {
      const payload = {
        name,
        trigger,
        triggerConditions: triggerSource !== 'all' ? { source: triggerSource } : {},
        steps,
        isActive: activate
      };
      await api.post('/automations', payload);
      toast.success(activate ? 'Automation activated!' : 'Automation saved!');
      window.location.href = '/automations';
    } catch (err) {
      toast.error('Failed to save automation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Automation</h1>
          <p className="text-gray-500 mt-1">Build your automated workflow</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleSave(false)} 
            disabled={saving}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium shadow-sm"
          >
            Save as Draft
          </button>
          <button 
            onClick={() => handleSave(true)} 
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm shadow-indigo-200"
          >
            Save & Activate
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Automation Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. New Meta Lead Welcome"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
            <select 
              value={trigger} 
              onChange={e => setTrigger(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="new_lead">New Lead Created</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Condition</label>
            <select 
              value={triggerSource} 
              onChange={e => setTriggerSource(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Any Source</option>
              <option value="facebook">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="website">Website</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
              <button 
                onClick={() => removeStep(index)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600"
              >
                <Trash className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {step.order}
                </div>
                <h3 className="text-lg font-semibold capitalize text-gray-900">
                  {step.action.replace('_', ' ')}
                </h3>
              </div>

              {step.action === 'send_email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
                  <select 
                    value={step.config.templateId || ''} 
                    onChange={e => updateStepConfig(index, 'templateId', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.subject})</option>
                    ))}
                  </select>
                </div>
              )}

              {step.action === 'wait' && (
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wait for</label>
                    <input 
                      type="number" 
                      min="1"
                      value={step.config.delayValue} 
                      onChange={e => updateStepConfig(index, 'delayValue', e.target.value)}
                      className="w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select 
                      value={step.config.delayUnit} 
                      onChange={e => updateStepConfig(index, 'delayUnit', e.target.value)}
                      className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}

              {step.action === 'create_task' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                    <input 
                      type="text" 
                      value={step.config.title} 
                      onChange={e => updateStepConfig(index, 'title', e.target.value)}
                      placeholder="e.g. Call lead to discuss funding"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due in (value)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={step.config.dueInValue} 
                      onChange={e => updateStepConfig(index, 'dueInValue', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due in (unit)</label>
                    <select 
                      value={step.config.dueInUnit} 
                      onChange={e => updateStepConfig(index, 'dueInUnit', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="py-4 text-gray-300">
              <ArrowDown className="w-6 h-6" />
            </div>
          </React.Fragment>
        ))}

        <div className="w-full max-w-2xl bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <h3 className="text-gray-600 mb-4 font-medium">Add Next Step</h3>
          <div className="flex justify-center space-x-3">
            <button onClick={() => addStep('send_email')} className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
              Send Email
            </button>
            <button onClick={() => addStep('wait')} className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
              Wait/Delay
            </button>
            <button onClick={() => addStep('create_task')} className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
              Create Task
            </button>
            <button onClick={() => addStep('stop')} className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 text-sm font-medium text-red-600">
              Stop Automation
            </button>
          </div>
        </div>

        <div className="mt-12 flex space-x-4 w-full max-w-2xl">
          <button 
            disabled={saving}
            onClick={() => handleSave(false)} 
            className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Save as Draft
          </button>
          <button 
            disabled={saving}
            onClick={() => handleSave(true)} 
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Save & Activate
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomationBuilder;
