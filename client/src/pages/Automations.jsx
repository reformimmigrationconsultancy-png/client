import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { PlayIcon as Play, PauseIcon as Pause, PlusIcon as Plus, Cog6ToothIcon as Settings, DocumentDuplicateIcon as Copy, TrashIcon as Trash, ClockIcon as Clock, CheckCircleIcon as CheckCircle } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const Automations = () => {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await api.get('/automations');
      setAutomations(res.data);
    } catch (err) {
      toast.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/automations/${id}`, { isActive: !currentStatus });
      toast.success(currentStatus ? 'Automation Paused' : 'Automation Activated');
      fetchAutomations();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deleteAutomation = async (id) => {
    if (window.confirm('Are you sure? This will delete the automation and all execution history.')) {
      try {
        await api.delete(`/automations/${id}`);
        toast.success('Automation deleted');
        fetchAutomations();
      } catch (err) {
        toast.error('Failed to delete automation');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-500 mt-1">Manage automated email workflows and follow-ups.</p>
        </div>
        <button 
          onClick={() => window.location.href = '/automations/new'}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Automation
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading automations...</div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h3>
          <p className="text-gray-500 mb-6">Create your first automation to start following up with leads automatically.</p>
          <button 
            onClick={() => window.location.href = '/automations/new'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Automation
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {automations.map(auto => (
            <div key={auto._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{auto.name}</h3>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${auto.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {auto.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-4">
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> Trigger: {auto.trigger === 'new_lead' ? 'New Lead' : auto.trigger}</span>
                  <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> {auto.stats?.enrolled || 0} enrolled ({auto.stats?.active || 0} active)</span>
                  <span>{auto.steps.length} steps</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                <button 
                  onClick={() => toggleStatus(auto._id, auto.isActive)}
                  className={`p-2 rounded-lg border ${auto.isActive ? 'text-amber-600 hover:bg-amber-50 border-amber-200' : 'text-green-600 hover:bg-green-50 border-green-200'}`}
                  title={auto.isActive ? 'Pause' : 'Activate'}
                >
                  {auto.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => deleteAutomation(auto._id)}
                  className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Automations;
