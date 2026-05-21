import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { UserGroupIcon, BriefcaseIcon, CheckBadgeIcon, ChartBarIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
    <div className="flex h-full items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium text-sm">Loading Insights...</p>
       </div>
    </div>
  );

  if(!stats) return <div className="p-8 text-red-500 font-bold">Terminal Error: Data Stream Inaccessible</div>;

  const kpis = [
    { name: 'Portfolio Growth', value: stats.totalLeads, sub: '+12.5% vs LW', icon: UserGroupIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { name: 'Active Pipeline', value: stats.activeLeads, sub: '8 Priority High', icon: BriefcaseIcon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { name: 'Revenue Closure', value: stats.closedDeals, sub: 'Valued at $2.4M', icon: CheckBadgeIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { name: 'Efficiency Ratio', value: `${stats.conversionRate}%`, sub: 'Optimal Range', icon: ChartBarIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ];

  const sourceData = stats.bySource?.map(s => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    count: s.count
  })) || [];

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-12 max-w-[1600px] mx-auto bg-[#fdfdfd] flex-1 overflow-y-auto overflow-x-hidden pb-32">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div className="animate-in fade-in slide-in-from-left duration-500">
           <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
           <p className="text-slate-500 font-medium mt-1 flex items-center gap-2 text-sm">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             Real-time data synchronization active
           </p>
         </div>
         <div className="flex gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all text-center">Generate Report</button>
            <button className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all text-center">System Settings</button>
         </div>
       </div>

       {/* KPI Cards */}
       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom duration-700">
         {kpis.map((kpi) => (
           <div key={kpi.name} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 group hover:border-slate-300 transition-all duration-300 relative overflow-hidden`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${kpi.bg} ${kpi.color}`}>
                   <kpi.icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">{kpi.name}</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{kpi.sub}</span>
                </div>
              </div>
           </div>
         ))}
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         {/* Source Chart */}
         <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Market Channel Attributions</h3>
              <div className="flex gap-2">
                 {['Daily', 'Weekly', 'Monthly'].map(t => (
                   <button key={t} className={`px-3 py-1 rounded-md text-xs font-medium border border-slate-200 hover:bg-slate-50 transition-colors ${t === 'Weekly' ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-600'}`}>{t}</button>
                 ))}
              </div>
            </div>
            <div className="h-80 w-full min-w-0 relative">
               <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={sourceData}>
                     <XAxis dataKey="name" stroke="#e2e8f0" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                     <YAxis stroke="#e2e8f0" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                     <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '10px' }} />
                     <Bar dataKey="count" fill="url(#colorBar)" radius={[10, 10, 10, 10]} barSize={40}>
                        <defs>
                           <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={1}/>
                           </linearGradient>
                        </defs>
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Pipeline Summary */}
         <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 relative z-10">Revenue Pipeline</h3>
            <div className="space-y-6 relative z-10">
               {[
                   { label: 'Unprocessed Inquiry', count: stats.pipeline.newLeads, color: 'bg-blue-500' },
                   { label: 'Active Resonance', count: stats.pipeline.contacted, color: 'bg-indigo-500' },
                   { label: 'Strategic Dialog', count: stats.pipeline.interested, color: 'bg-purple-500' },
                   { label: 'Contract Processing', count: stats.pipeline.docsReceived, color: 'bg-orange-400' },
                   { label: 'Finalizing Terms', count: stats.pipeline.approved, color: 'bg-emerald-500' }
               ].map(stage => {
                   const percent = stats.totalLeads > 0 ? (stage.count / stats.totalLeads)*100 : 0;
                   return (
                     <div key={stage.label} className="group/item">
                        <div className="flex justify-between items-center text-sm font-medium mb-2 w-full">
                           <span className="text-slate-600 group-hover/item:text-slate-900 transition-colors">{stage.label}</span>
                           <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{stage.count}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                           <div className={`h-full rounded-full ${stage.color} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
                        </div>
                     </div>
                   )
               })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
               <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Conversion Velocity</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">Accelerated</p>
               </div>
               <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <ChartBarIcon className="w-5 h-5" />
               </div>
            </div>
         </div>
       </div>

       {/* Recent Activity Table */}
       <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-6">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-semibold text-slate-900">Recent Command Activity</h3>
             <button className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">Global History</button>
          </div>
          
          <div className="overflow-x-auto no-scrollbar">
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b border-slate-100">
                      <th className="pb-3 text-xs font-medium text-slate-500 uppercase">Client Target</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 uppercase">Interaction Type</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 uppercase">Outcome Code</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 uppercase">Temporal Stamp</th>
                      <th className="pb-3 text-xs font-medium text-slate-500 uppercase text-right">Reference</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {stats.recentCalls?.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-sm font-medium text-slate-400">No Interaction History Detected</td></tr>
                   ) : (
                      stats.recentCalls?.map((call, idx) => (
                         <tr key={idx} className="group hover:bg-slate-50 transition-all cursor-pointer">
                            <td className="py-4">
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs">
                                    {call.client?.fullName?.charAt(0) || 'C'}
                                  </div>
                                  <span className="text-sm font-medium text-slate-800">{call.client?.fullName || 'Anonymous'}</span>
                               </div>
                            </td>
                            <td className="py-4">
                               <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${call.direction === 'outbound' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                  {call.direction}
                               </span>
                            </td>
                            <td className="py-4">
                               <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${call.status === 'answered' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                  <span className="text-sm font-medium text-slate-600 capitalize">{call.status}</span>
                               </div>
                            </td>
                            <td className="py-4 text-sm text-slate-500">
                               {format(new Date(call.callTime || call.createdAt), 'MMM d, h:mm a')}
                            </td>
                            <td className="py-4 text-right">
                               <button className="h-8 w-8 rounded-md bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-slate-600 transition-all ml-auto">
                                  <ArrowUpTrayIcon className="w-4 h-4" />
                               </button>
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </div>

    </div>
  );
}
