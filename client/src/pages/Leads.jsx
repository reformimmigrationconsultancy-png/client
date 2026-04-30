import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const STAGES = {
  new_lead: { id: 'new_lead', title: 'New Lead', color: 'border-blue-500' },
  contacted: { id: 'contacted', title: 'Contacted', color: 'border-indigo-500' },
  interested: { id: 'interested', title: 'Interested', color: 'border-purple-500' },
  documents_received: { id: 'documents_received', title: 'Docs Received', color: 'border-orange-400' },
  approved: { id: 'approved', title: 'Approved', color: 'border-emerald-500' },
  closed: { id: 'closed', title: 'Closed', color: 'border-slate-500' },
};

export default function Leads() {
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    fullName: '',
    email: '',
    phone: '',
    source: 'manual',
    stage: 'new_lead',
    loanAmount: '',
    propertyValue: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      const leads = res.data.clients;
      
      const initialColumns = Object.keys(STAGES).reduce((acc, key) => {
        acc[key] = {
           ...STAGES[key],
           items: leads.filter(l => l.stage === key)
        };
        return acc;
      }, {});
      
      setColumns(initialColumns);
    } catch (error) {
       console.error(error);
       toast.error('Failed to fetch leads');
    } finally {
       setLoading(false);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', newLead);
      toast.success('Lead added successfully');
      setIsAddModalOpen(false);
      setNewLead({ fullName: '', email: '', phone: '', source: 'manual', stage: 'new_lead', loanAmount: '', propertyValue: '' });
      fetchLeads();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add lead');
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceCol = columns[source.droppableId];
      const destCol = columns[destination.droppableId];
      const sourceItems = [...sourceCol.items];
      const destItems = [...destCol.items];
      
      const [movedItem] = sourceItems.splice(source.index, 1);
      movedItem.stage = destination.droppableId;
      destItems.splice(destination.index, 0, movedItem);
      
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems }
      });

      try {
        await api.put(`/clients/${movedItem._id}`, { stage: destination.droppableId });
        toast.success(`Moved to ${destCol.title}`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to update stage');
        fetchLeads();
      }
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...column, items: copiedItems }
      });
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Compiling Pipeline...</p>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 bg-[#f8fafc] overflow-hidden">
       <div className="p-8 pb-4 flex justify-between items-end bg-white/50 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Lead Pipeline</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Real-time business opportunity orchestration.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-2 group"
          >
             <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> 
             Create New Lead
          </button>
       </div>

       <div className="flex-1 overflow-x-auto p-8 scroll-smooth">
         <div className="flex gap-8 h-full min-w-max">
           <DragDropContext onDragEnd={onDragEnd}>
              {Object.entries(columns).map(([id, column]) => (
                 <div key={id} className="flex flex-col w-80 shrink-0 bg-slate-100/50 rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm relative group">
                    <div className={`p-4 bg-white border-b border-slate-100 flex justify-between items-center relative z-10`}>
                       <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${column.color.replace('border-', 'bg-')}`}></div>
                          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">{column.title}</h3>
                       </div>
                       <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-200">
                          {column.items.length}
                       </span>
                    </div>
                    
                    <Droppable droppableId={id}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50' : 'bg-transparent'}`}
                          style={{ minHeight: '150px' }}
                        >
                           {column.items.map((item, index) => (
                             <Draggable key={item._id} draggableId={item._id} index={index}>
                               {(provided, snapshot) => (
                                 <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => (window.location.href = `/clients/${item._id}`)}
                                    className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer group relative overflow-hidden ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 border-blue-500 z-50' : ''}`}
                                 >
                                    <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${column.color.replace('border-', 'bg-')}`}></div>
                                    
                                    <div className="flex flex-col gap-1">
                                       <h4 className="font-black text-slate-800 text-sm tracking-tight group-hover:text-blue-600 transition-colors">{item.fullName}</h4>
                                       <p className="text-[11px] font-bold text-slate-400 truncate uppercase tracking-tighter">{item.email || item.phone || 'No Contact Established'}</p>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-between">
                                       <div className="flex items-center gap-1.5">
                                          <div className="px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-tighter border border-slate-100">
                                            {item.source}
                                          </div>
                                          {item.loanAmount && (
                                            <div className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter border border-emerald-100">
                                              ${(item.loanAmount / 1000).toFixed(0)}k
                                            </div>
                                          )}
                                       </div>
                                       <span className="text-[10px] font-extrabold text-slate-300">
                                         {format(new Date(item.createdAt), 'MMM d')}
                                       </span>
                                    </div>
                                 </div>
                               )}
                             </Draggable>
                           ))}
                           {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                 </div>
              ))}
           </DragDropContext>
         </div>
       </div>

       {isAddModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in duration-300">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-widest text-xs">Register New Opportunity</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
                     <XMarkIcon className="w-5 h-5 text-slate-600" />
                  </button>
               </div>
               
               <form onSubmit={handleAddLead} className="p-8 space-y-5">
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Client Personality Name</label>
                     <input 
                        required
                        type="text"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        placeholder="e.g. Johnathan Sterling"
                        value={newLead.fullName}
                        onChange={e => setNewLead({...newLead, fullName: e.target.value})}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Terminal</label>
                      <input 
                          type="email"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                          placeholder="client@terminal.com"
                          value={newLead.email}
                          onChange={e => setNewLead({...newLead, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Direct Dial</label>
                      <input 
                          required
                          type="text"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                          placeholder="+91..."
                          value={newLead.phone}
                          onChange={e => setNewLead({...newLead, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Projected Loan</label>
                      <input 
                          type="number"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                          placeholder="e.g. 500000"
                          value={newLead.loanAmount}
                          onChange={e => setNewLead({...newLead, loanAmount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Asset Value</label>
                      <input 
                          type="number"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                          placeholder="e.g. 750000"
                          value={newLead.propertyValue}
                          onChange={e => setNewLead({...newLead, propertyValue: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Origin Channel</label>
                     <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                        value={newLead.source}
                        onChange={e => setNewLead({...newLead, source: e.target.value})}
                     >
                        <option value="manual">Manual Selection</option>
                        <option value="website">Direct Website</option>
                        <option value="whatsapp">WhatsApp Business</option>
                        <option value="facebook">Meta Messenger</option>
                        <option value="email">Direct Inbox</option>
                     </select>
                  </div>

                  <div className="pt-6 flex gap-4">
                     <button 
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                     >
                        Discard
                     </button>
                     <button 
                        type="submit"
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-500 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:translate-y-0"
                     >
                        Register Opportunity
                     </button>
                  </div>
               </form>
            </div>
         </div>
       )}

    </div>
  );
}
