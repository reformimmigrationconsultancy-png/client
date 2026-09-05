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
  ArrowPathIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  FireIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  TableCellsIcon,
  PhoneIcon,
  EnvelopeIcon,
  SparklesIcon,
  CheckBadgeIcon,
  ClockIcon,
  TagIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid';
import io from 'socket.io-client';

const STAGES = {
  new_lead: { id: 'new_lead', title: 'New Opportunity', color: 'blue', icon: '✨', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  contacted: { id: 'contacted', title: 'Contacted', color: 'indigo', icon: '📞', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  interested: { id: 'interested', title: 'Negotiation', color: 'purple', icon: '🤝', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  documents_received: { id: 'documents_received', title: 'Documentation', color: 'amber', icon: '📄', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { id: 'approved', title: 'Approved', color: 'emerald', icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  closed: { id: 'closed', title: 'Closed/Won', color: 'slate', icon: '🏆', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

const SourceIcon = ({ source }) => {
  switch (source?.toLowerCase()) {
    case 'facebook': return <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-[#1877F2]" />;
    case 'instagram': return <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-[#E4405F]" />;
    default: return <UserGroupIcon className="w-3.5 h-3.5 text-slate-400" />;
  }
};

export default function Leads() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState({});
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStageFilter, setActiveStageFilter] = useState('all');
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newLead, setNewLead] = useState({
    fullName: '', email: '', phone: '', source: 'facebook', stage: 'new_lead', loanAmount: '', propertyValue: ''
  });

  useEffect(() => {
    fetchLeads();
    const newSocket = io(BACKEND_URL, { withCredentials: true, transports: ['polling', 'websocket'] });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchLeads();
    };
    socket.on('new_lead', handleRefresh);
    socket.on('new_client', handleRefresh);
    socket.on('update_lead', handleRefresh);
    socket.on('update_client', handleRefresh);
    return () => {
      socket.off('new_lead', handleRefresh);
      socket.off('new_client', handleRefresh);
      socket.off('update_lead', handleRefresh);
      socket.off('update_client', handleRefresh);
    };
  }, [socket]);

  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients?limit=1000');
      const leads = res.data.clients || [];
      setAllLeads(leads);

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

  const handleSyncMetaLeads = async () => {
    setIsSyncingMeta(true);
    const tId = toast.loading('Syncing live leads from Meta Facebook Ads...');
    try {
      const res = await api.post('/clients/sync-meta-leads');
      const count = res.data.count || 0;
      if (count > 0) {
        toast.success(`🎉 Successfully imported ${count} new Meta Lead${count > 1 ? 's' : ''}!`, { id: tId });
      } else {
        toast.success('All Meta Lead Ads are already up to date!', { id: tId });
      }
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Meta sync failed. Check Meta token in Settings.', { id: tId });
    } finally {
      setIsSyncingMeta(false);
    }
  };

  const handleClearAllLeads = async () => {
    setIsClearing(true);
    const tId = toast.loading('Wiping all leads and resetting pipeline...');
    try {
      const res = await api.post('/clients/clear-all-leads');
      toast.success(res.data.message || 'All old leads deleted successfully!', { id: tId });
      setIsClearModalOpen(false);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear leads', { id: tId });
    } finally {
      setIsClearing(false);
    }
  };

  const handleUpdateStage = async (leadId, newStage, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/clients/${leadId}`, { stage: newStage });
      toast.success(`Stage updated to ${STAGES[newStage]?.title || newStage}`);
      fetchLeads();
    } catch (err) {
      toast.error('Failed to update stage');
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

  const filteredLeads = useMemo(() => {
    let list = allLeads;
    if (activeStageFilter !== 'all') {
      list = list.filter(l => l.stage === activeStageFilter);
    }
    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.fullName && item.fullName.toLowerCase().includes(search)) || 
        (item.email && item.email.toLowerCase().includes(search)) ||
        (item.phone && item.phone.includes(search)) ||
        (item.metaData?.formName && item.metaData.formName.toLowerCase().includes(search))
      );
    }
    return list;
  }, [allLeads, activeStageFilter, searchQuery]);

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

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-t-4 border-blue-600 animate-spin"></div>
        <FireIcon className="w-8 h-8 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden">
      {/* Compact Top Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-30 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Leads Pipeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
              {allLeads.length} leads
            </span>
          </div>
          <p className="text-slate-500 font-medium text-[13px] mt-1">
            Manage and follow up with your incoming leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsClearModalOpen(true)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
            title="Reset Pipeline & Clear All Old Leads"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Professional CRM Toolbar */}
      <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        
        {/* Left Toolbar: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative group w-full sm:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search leads by name, email or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-[13px] font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-400 outline-none w-full transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <select 
                value={activeStageFilter}
                onChange={(e) => setActiveStageFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
              >
                <option value="all">Status: All</option>
                {Object.values(STAGES).map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.title}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {(activeStageFilter !== 'all' || searchQuery) && (
              <button 
                onClick={() => { setActiveStageFilter('all'); setSearchQuery(''); }}
                className="text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-colors px-2"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Right Toolbar: Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button onClick={fetchLeads} className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors" title="Refresh">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleSyncMetaLeads}
            disabled={isSyncingMeta}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-lg text-[13px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${isSyncingMeta ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
            <span>{isSyncingMeta ? 'Syncing...' : 'Sync Leads'}</span>
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-[1px]"
          >
            <PlusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>New Lead</span>
          </button>
        </div>
      </div>



      {/* MAIN VIEW CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* ========================================================================= */}
        {/* TABLE LIST VIEW                                                        */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100/80 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-6 w-1/4">Lead</th>
                  <th className="py-3 px-6 w-1/5">Contact</th>
                  <th className="py-3 px-6 w-1/5">Source</th>
                  <th className="py-3 px-6">Value</th>
                  <th className="py-3 px-6">Stage</th>
                  <th className="py-3 px-6">Created</th>
                  <th className="py-3 px-6 text-right w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-[13px] text-slate-700">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                          <UserGroupIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-[14px] font-semibold text-slate-900">No leads found</h3>
                        <p className="text-[13px] text-slate-500 mt-1 mb-5">
                          {searchQuery ? 'No leads matched your search query.' : 'Try changing your filters or create a new lead.'}
                        </p>
                        <button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[13px] font-semibold transition-colors"
                        >
                          + New Lead
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((item) => {
                    const stage = STAGES[item.stage] || STAGES.new_lead;
                    return (
                      <tr 
                        key={item._id}
                        onClick={() => navigate(`/clients/${item._id}`)}
                        className="hover:bg-slate-50/60 cursor-pointer transition-colors group h-[64px]"
                      >
                        {/* LEAD */}
                        <td className="py-3 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center text-[12px] shrink-0 ring-1 ring-slate-200/50">
                              {getInitials(item.fullName)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[14px] text-slate-900 leading-snug">{item.fullName}</span>
                              <span className="text-[12px] text-slate-400 leading-snug">{item.email && item.email !== 'N/A' ? item.email : 'No email'}</span>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}
                        <td className="py-3 px-6 whitespace-nowrap">
                          <div className="text-[13px] font-medium text-slate-700">
                            {item.phone && item.phone !== 'N/A' ? item.phone : '—'}
                          </div>
                        </td>

                        {/* SOURCE */}
                        <td className="py-3 px-6 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <SourceIcon source={item.source} />
                            <span className="text-[13px] text-slate-600 font-medium truncate" title={item.metaData?.formName || 'Meta Ads'}>
                              {item.metaData?.formName || (item.source?.toLowerCase() === 'facebook' ? 'Meta Ads' : 'Manual Entry')}
                            </span>
                          </div>
                        </td>

                        {/* VALUE */}
                        <td className="py-3 px-6 whitespace-nowrap">
                          {item.loanAmount ? (
                            <span className="font-medium text-slate-700">${Number(item.loanAmount).toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* STAGE */}
                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${stage.bg} ${stage.text}`}>
                            {stage.title}
                          </span>
                        </td>

                        {/* CREATED */}
                        <td className="py-3 px-6 whitespace-nowrap text-slate-400 text-[13px]">
                          {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : '—'}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-6 text-right whitespace-nowrap">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-[13px] font-medium text-indigo-600 hover:text-indigo-800">
                               Open &rarr;
                             </span>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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

      {/* Clear All Leads Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-red-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <ExclamationTriangleIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Reset Pipeline &amp; Clear All Leads?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will permanently delete all old leads, conversations, messages, and webhook logs. You can start completely fresh with your live incoming ads!
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  disabled={isClearing}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllLeads}
                  disabled={isClearing}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isClearing ? 'Deleting...' : 'Yes, Delete All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
