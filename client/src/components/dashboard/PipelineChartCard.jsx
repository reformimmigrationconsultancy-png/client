import React from 'react';

export default function PipelineChartCard({ stats }) {
  const pipeline = stats?.pipeline || {};
  
  const stages = [
    { name: 'New', value: pipeline.newLeads || 0, color: 'bg-blue-500' },      
    { name: 'Contacted', value: pipeline.contacted || 0, color: 'bg-indigo-500' },    
    { name: 'Qualified', value: pipeline.interested || 0, color: 'bg-purple-500' },  
    { name: 'Approved', value: pipeline.approved || 0, color: 'bg-emerald-500' }      
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col w-full mt-6">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">
          Pipeline Snapshot
        </h3>
      </div>

      <div className="px-6 py-6 w-full flex items-center justify-between">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.name}>
            <div className="flex flex-col items-center flex-1 group">
              <span className="text-[24px] font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
                {stage.value}
              </span>
              <div className="flex items-center gap-2 mt-3">
                <span className={`w-2 h-2 rounded-full ${stage.color} shadow-sm`}></span>
                <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">
                  {stage.name}
                </span>
              </div>
            </div>
            {idx < stages.length - 1 && (
              <div className="hidden sm:block w-12 h-px bg-slate-200 mt-[-20px]"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
