import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CalendarIcon as Calendar, CheckCircleIcon as CheckCircle, ClockIcon as Clock, ExclamationCircleIcon as AlertCircle } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const FollowUps = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data.reminders || []);
    } catch (err) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id) => {
    try {
      await api.put(`/reminders/${id}`, { isCompleted: true });
      toast.success('Follow-up completed');
      fetchReminders();
    } catch (err) {
      toast.error('Failed to update follow-up');
    }
  };

  const now = new Date();
  
  const overdue = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) < now && new Date(r.dueDate).toDateString() !== now.toDateString());
  const today = reminders.filter(r => !r.isCompleted && new Date(r.dueDate).toDateString() === now.toDateString());
  const upcoming = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) > now && new Date(r.dueDate).toDateString() !== now.toDateString());

  const renderSection = (title, items, icon, colorClass) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <div className={`flex items-center space-x-2 mb-4 ${colorClass}`}>
          {icon}
          <h2 className="text-lg font-bold">{title} ({items.length})</h2>
        </div>
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h3 className="text-md font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">Lead: <a href={`/clients/${item.client?._id}`} className="text-blue-600 hover:underline">{item.client?.fullName || 'Unknown'}</a></p>
                <div className="flex items-center space-x-3 mt-2 text-xs">
                  <span className="flex items-center text-gray-500"><Calendar className="w-3 h-3 mr-1" /> {new Date(item.dueDate).toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${item.priority === 'high' ? 'bg-red-100 text-red-800' : item.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {item.priority?.toUpperCase() || 'MEDIUM'}
                  </span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <button 
                  onClick={() => markComplete(item._id)}
                  className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
        <p className="text-gray-500 mt-1">Manage your manual and automated tasks.</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading follow-ups...</div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-500">You don't have any pending follow-ups.</p>
        </div>
      ) : (
        <div>
          {renderSection('OVERDUE', overdue, <AlertCircle className="w-5 h-5" />, 'text-red-600')}
          {renderSection('TODAY', today, <Clock className="w-5 h-5" />, 'text-amber-600')}
          {renderSection('UPCOMING', upcoming, <Calendar className="w-5 h-5" />, 'text-blue-600')}
        </div>
      )}
    </div>
  );
};

export default FollowUps;
