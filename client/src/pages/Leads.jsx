import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../utils/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  PlusIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, EnvelopeIcon, GlobeAltIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';
import io from 'socket.io-client';

const STAGES = {
  new_lead: { id: 'new_lead', title: 'New Opportunity', color: 'blue', icon: '✨' },
  contacted: { id: 'contacted', title: 'Contacted', color: 'indigo', icon: '📞' },
  interested: { id: 'interested', title: 'Negotiation', color: 'purple', icon: '🤝' },
  documents_received: { id: 'documents_received', title: 'Documentation', color: 'orange', icon: '📄' },
  approved: { id: 'approved', title: 'Approved', color: 'emerald', icon: '✅' },
  closed: { id: 'closed', title: 'Closed/Won', color: 'slate', icon: '🏆' },
};

const SourceIcon = ({ source }) => {
  switch (source?.toLowerCase()) {
    case 'facebook': return <ChatBubbleLeftRightIcon className="w-3 h-3 text-[#1877F2]" />;
    case 'instagram': return <ChatBubbleLeftRightIcon className="w-3 h-3 text-[#E4405F]" />;
    case 'whatsapp': return <DevicePhoneMobileIcon className="w-3 h-3 text-[#25D366]" />;
    case 'email': return <EnvelopeIcon className="w-3 h-3 text-[#EA4335]" />;
    case 'website': return <GlobeAltIcon className="w-3 h-3 text-blue-500" />;
    default: return <UserGroupIcon className="w-3 h-3 text-slate-400" />;
  }
};

export default function Leads() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newLead, setNewLead] = useState({
    fullName: '', email: '', phone: '', source: 'manual', stage: 'new_lead', loanAmount: '', propertyValue: ''
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem('last_meta_sync') || 'Never');

  useEffect(() => {
    fetchLeads();
    const newSocket = io(BACKEND_URL, { withCredentials: true, transports: ['websocket', 'polling'] });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewLead = (lead) => {
      toast.success(`New Meta Lead: ${lead.fullName}`, {
        icon: '🔥',
        style: { borderRadius: '15px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold' },
        duration: 5000
      });
      fetchLeads();
    };
    socket.on('new_lead', handleNewLead);
    return () => socket.off('new_lead', handleNewLead);
  }, [socket]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      const leads = res.data.clients;
      const initialColumns = Object.keys(STAGES).reduce((acc, key) => {
        acc[key] = { ...STAGES[key], items: leads.filter(l => l.stage === key) };
        return acc;
      }, {});
      setColumns(initialColumns);
    } catch (error) {
      toast.error('Failed to sync pipeline');
    } finally {
      setLoading(false);
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
      } catch (err) {
        toast.error('Update failed. Refreshing...');
        fetchLeads();
      }
    }
  };

  const filteredColumns = useMemo(() => {
    if (!searchQuery) return columns;
    const search = searchQuery.toLowerCase();
    const newCols = {};
    Object.keys(columns).forEach(key => {
      newCols[key] = {
        ...columns[key],
        items: columns[key].items.filter(item => 
          item.fullName.toLowerCase().includes(search) || 
          item.email?.toLowerCase().includes(search) ||
          item.phone?.includes(search)
        )
      };
    });
    return newCols;
  }, [columns, searchQuery]);

  const syncMetaLeads = async () => {
    if (syncing) return;
    setSyncing(true);
    const toastId = toast.loading('Syncing historical Meta leads...');
    try {
      const res = await api.post('/clients/sync-meta-leads');
      toast.success(`Sync complete! Added ${res.data.count} new leads.`, { id: toastId });
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(now);
      localStorage.setItem('last_meta_sync', now);
      fetchLeads();
    } catch (err) {
      toast.error('Sync failed. Please check Meta connection.', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-t-4 border-blue-600 animate-spin"></div>
        <FireIcon className="w-8 h-8 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Premium Header */}
      <div className="px-4 md:px-8 py-4 md:py-6 bg-white border-b border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm z-50 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Revenue Pipeline</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Real-time Meta Ads Active</p>
            </div>
          </div>
          <div className="hidden sm:block h-10 w-[1px] bg-slate-200"></div>
          <div className="relative group w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search prospects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none w-full transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-3 w-full lg:w-auto">
          <div className="hidden sm:flex flex-col text-right pr-1">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Meta Sync</span>
            <span className="text-[11px] font-black text-slate-600">{lastSyncTime}</span>
          </div>
          <button 
            onClick={syncMetaLeads}
            disabled={syncing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 rounded-xl font-bold text-xs md:text-sm transition-all border border-slate-200"
          >
            <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Meta'}</span>
          </button>
          <div className="hidden sm:block h-6 w-[1px] bg-slate-200"></div>
          <button onClick={fetchLeads} className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200">
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <div className="hidden sm:block h-6 w-[1px] bg-slate-200"></div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4 pt-2 md:p-8 md:pt-4 custom-scrollbar bg-slate-50">
        <div className="flex gap-4 md:gap-6 h-full min-w-max">
          <DragDropContext onDragEnd={onDragEnd}>
            {Object.entries(filteredColumns).map(([id, column]) => (
              <div key={id} className="flex flex-col w-[280px] sm:w-72 shrink-0">
                <div className="flex items-center justify-between px-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{column.icon}</span>
                    <h3 className="font-bold text-slate-700 text-sm">{column.title}</h3>
                  </div>
                  <span className="bg-slate-200/50 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {column.items.length}
                  </span>
                </div>
                
                <Droppable droppableId={id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 rounded-2xl p-2 space-y-3 transition-colors duration-200 min-h-[500px] ${snapshot.isDraggingOver ? 'bg-slate-200/50' : 'bg-transparent'}`}
                    >
                      {column.items.map((item, index) => (
                        <Draggable key={item._id} draggableId={item._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/clients/${item._id}`)}
                              className={`bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none ${snapshot.isDragging ? 'shadow-2xl scale-105 border-blue-500 rotate-2' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg bg-${column.color}-50 text-${column.color}-600`}>
                                    <SourceIcon source={item.source} />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.source || 'Manual'}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {format(new Date(item.createdAt), 'MMM d')}
                                </span>
                              </div>

                              <h4 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">{item.fullName}</h4>
                              <p className="text-[11px] font-medium text-slate-500 truncate mb-4">{item.email || item.phone || 'No contact details'}</p>
                              
                              <div className="flex items-center gap-2">
                                {item.loanAmount ? (
                                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100">
                                    <CurrencyDollarIcon className="w-3 h-3" />
                                    {(item.loanAmount / 1000).toFixed(0)}k
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">No Val.</div>
                                )}
                                {item.source === 'facebook' && (
                                  <div className="px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100 flex items-center gap-1">
                                    <FireIcon className="w-3 h-3" />
                                    HOT
                                  </div>
                                )}
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

      {/* Advanced Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">New Opportunity</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post('/clients', newLead);
                toast.success('Opportunity Registered');
                setIsAddModalOpen(false);
                fetchLeads();
              } catch (err) { toast.error('Creation Failed'); }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Full Identity</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-600/20 outline-none" value={newLead.fullName} onChange={e => setNewLead({...newLead, fullName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Email</label>
                  <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-600/20 outline-none" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Phone</label>
                  <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-600/20 outline-none" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
