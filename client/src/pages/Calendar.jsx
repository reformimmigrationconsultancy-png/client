import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { CalendarIcon, PlusIcon, BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { format, isToday, isFuture } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function Calendar() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data.reminders);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id, isCompleted) => {
    try {
      await api.put(`/reminders/${id}`, { isCompleted: !isCompleted });
      setReminders(reminders.map(r => r._id === id ? { ...r, isCompleted: !isCompleted } : r));
      toast.success(isCompleted ? 'Marked as pending' : 'Completed task');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task');
    }
  };

  if (loading) return <div className="p-8">Loading calendar...</div>;

  const upcoming = reminders.filter(r => isFuture(new Date(r.dueDate)) || isToday(new Date(r.dueDate)));
  const completed = reminders.filter(r => r.isCompleted);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto flex-1 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule & Tasks</h2>
          <p className="text-slate-500 mt-1">Keep track of follow-ups, document collections, and meetings.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm transition-all shadow-md">
          <PlusIcon className="w-4 h-4" />
          Add Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Upcoming Tasks */}
         <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Upcoming Schedule</h3>
            <div className="space-y-3">
               {upcoming.map((r) => (
                 <div 
                   key={r._id} 
                   className={`bg-white p-4 rounded-xl border-l-4 shadow-sm border border-slate-200 flex justify-between items-center ${r.isCompleted ? 'border-l-emerald-500' : 'border-l-blue-500'}`}
                 >
                    <div className="flex-1">
                       <h4 className={`font-semibold ${r.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{r.title}</h4>
                       <div className="flex gap-4 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                             <CalendarIcon className="w-3 h-3" />
                             {format(new Date(r.dueDate), 'MMM d, h:mm a')}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                             <BellIcon className="w-3 h-3" />
                             {r.type.replace(/_/g, ' ')}
                          </span>
                       </div>
                       {r.client && <p className="text-xs text-blue-600 mt-1 font-medium">For: {r.client.fullName}</p>}
                    </div>
                    <button 
                       onClick={() => toggleComplete(r._id, r.isCompleted)}
                       className={`p-2 rounded-full border transition-all ${r.isCompleted ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-300 text-slate-400 hover:text-emerald-500 hover:border-emerald-500'}`}
                    >
                       <CheckIcon className="w-5 h-5 font-bold" />
                    </button>
                 </div>
               ))}
               {upcoming.length === 0 && (
                 <p className="text-sm text-slate-500 py-4 text-center">No upcoming tasks found.</p>
               )}
            </div>
         </div>

         {/* Recently Completed */}
         <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Completed Recently</h3>
            <div className="space-y-3">
               {completed.slice(0, 5).map((r) => (
                 <div 
                   key={r._id} 
                   className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center opacity-70"
                 >
                    <div>
                       <h4 className="font-semibold text-slate-400 line-through text-sm">{r.title}</h4>
                       <span className="text-xs text-slate-400">Done on {format(new Date(r.updatedAt), 'MMM d')}</span>
                    </div>
                    <CheckIcon className="w-5 h-5 text-emerald-500" />
                 </div>
               ))}
               {completed.length === 0 && (
                 <p className="text-sm text-slate-500 py-4 text-center">No completed tasks yet.</p>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
