import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Cog6ToothIcon, ShieldCheckIcon, UserCircleIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto flex-1 overflow-y-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-slate-500 mt-1">Manage your CRM preferences and user configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 border-r border-slate-200 pr-8 space-y-2">
           <button className="w-full text-left p-2 rounded-md bg-blue-50 text-blue-600 font-medium flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5" /> Profile Settings
           </button>
           <button className="w-full text-left p-2 rounded-md hover:bg-slate-50 text-slate-600 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" /> Security & Auth
           </button>
           <button className="w-full text-left p-2 rounded-md hover:bg-slate-50 text-slate-600 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5" /> Personalization
           </button>
        </div>

        <div className="col-span-1 md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-8">
           <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                 <UserCircleIcon className="w-5 h-5 text-blue-600" />
                 Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                    <p className="font-medium text-slate-900 border-b border-slate-100 pb-2">{user?.name}</p>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                    <p className="font-medium text-slate-900 border-b border-slate-100 pb-2">{user?.email}</p>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">User Role</label>
                    <p className="font-medium text-slate-900 border-b border-slate-100 pb-2 capitalize">{user?.role}</p>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Account Status</label>
                    <p className="font-medium text-emerald-600 border-b border-slate-100 pb-2">Active</p>
                 </div>
              </div>
           </div>

           <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold text-sm hover:bg-blue-500 shadow-md transition-all">
                 Save Changes
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
