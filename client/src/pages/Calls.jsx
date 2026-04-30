import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { PhoneIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const res = await api.get('/calls');
      setCalls(res.data.calls);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading calls...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto flex-1 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Call History</h2>
          <p className="text-slate-500 mt-1">Manage and track all client communications via phone.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
          <PlusIcon className="w-4 h-4" />
          Log a Call
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Direction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {calls.map((call) => (
              <tr key={call._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{call.client?.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{call.direction}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                     call.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 
                     call.status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                   }`}>
                      {call.status}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{call.duration}s</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{call.loggedBy?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 whitespace-nowrap">
                   {format(new Date(call.callTime), 'MMM d, h:mm a')}
                </td>
              </tr>
            ))}
            {calls.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">
                   No calls recorded yet. Click "Log a Call" to start tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
