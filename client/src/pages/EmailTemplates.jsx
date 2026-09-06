import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { PlusIcon as Plus, PencilSquareIcon as Edit, TrashIcon as Trash, EnvelopeIcon as Mail } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/email-templates');
      setTemplates(res.data);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/email-templates/${id}`);
        toast.success('Template deleted');
        fetchTemplates();
      } catch (err) {
        toast.error('Failed to delete template');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 mt-1">Manage templates for automations and manual follow-ups.</p>
        </div>
        <button 
          onClick={() => window.location.href = '/templates/new'}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Template
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-6">Create your first email template to use in workflows.</p>
          <button 
            onClick={() => window.location.href = '/templates/new'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <div key={template._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                    {template.category}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4 line-clamp-3">
                <span className="font-medium">Subject:</span> {template.subject}
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end space-x-2">
                <button 
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => deleteTemplate(template._id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
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

export default EmailTemplates;
