import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { UserGroupIcon, BriefcaseIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
       const res = await api.get('/dashboard/stats');
       if(res.data.success) {
          setStats(res.data.stats);
       }
    } catch(err) {
       console.error("Failed to load dashboard stats", err);
    } finally {
       setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-slate-50/50">
       <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">Loading your insights...</p>
       </div>
    </div>
  );

  if(!stats) return <div className="p-8 text-red-500 font-bold text-center">Unable to load dashboard data. Please try again.</div>;

  const kpis = [
    { name: 'Total Leads', value: stats.totalLeads, sub: 'All recorded leads', icon: UserGroupIcon, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
    { name: 'Active Emails', value: stats.openConversations, sub: 'Open email threads', icon: EnvelopeIcon, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    { name: 'New Inquiries', value: stats.pipeline?.newLeads || 0, sub: 'Needs attention', icon: BriefcaseIcon, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
  ];

  const sourceData = (stats.bySource || []).map(s => ({
    name: s._id ? (s._id.charAt(0).toUpperCase() + s._id.slice(1)) : 'Direct/Other',
    count: s.count
  }));

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto bg-slate-50/50 flex-1 overflow-y-auto min-h-full pb-20">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-200/60">
         <div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
           <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2">
             <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
             </span>
             Leads & Emails syncing in real-time
           </p>
         </div>
       </div>

       {/* KPI Cards */}
       <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
         {kpis.map((kpi, idx) => (
           <div key={kpi.name} className={`bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
              <div className="flex items-center gap-4 mb-5">
                <div className={`p-3.5 rounded-xl ${kpi.bg} ${kpi.color} ring-1 ring-inset ${kpi.border}`}>
                   <kpi.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-500">{kpi.name}</h3>
              </div>
              <div className="flex items-end justify-between">
                 <p className="text-4xl font-black text-slate-800 tracking-tight">{kpi.value}</p>
                 <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-slate-600 bg-slate-100 ring-1 ring-inset ring-slate-500/10`}>
                    {kpi.sub}
                 </span>
              </div>
           </div>
         ))}
       </div>

       {/* Source Chart */}
       <div className="bg-white rounded-2xl border border-slate-200/60 p-6 sm:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Lead Sources</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Where your traffic is coming from</p>
            </div>
          </div>
          <div className="h-[360px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                   <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                   <Tooltip 
                      cursor={{fill: '#f8fafc'}} 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 600 }}
                   />
                   <Bar dataKey="count" radius={[8, 8, 8, 8]} maxBarSize={60}>
                      {sourceData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
       </div>

    </div>
  );
}
