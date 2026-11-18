import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon, 
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, GlobeAltIcon } from '@heroicons/react/24/solid';

const STAGES = {
  new_lead: { 
    id: 'new_lead', 
    title: 'New Opportunity', 
    dot: 'bg-blue-500', 
    bg: 'bg-blue-50/70', 
    border: 'border-blue-200/80', 
    text: 'text-blue-700', 
    badgeBg: 'bg-blue-100 text-blue-800' 
  },
  contacted: { 
    id: 'contacted', 
    title: 'Contacted', 
    dot: 'bg-indigo-500', 
    bg: 'bg-indigo-50/70', 
    border: 'border-indigo-200/80', 
    text: 'text-indigo-700', 
    badgeBg: 'bg-indigo-100 text-indigo-800' 
  },
  interested: { 
    id: 'interested', 
    title: 'Negotiation', 
    dot: 'bg-purple-500', 
    bg: 'bg-purple-50/70', 
    border: 'border-purple-200/80', 
    text: 'text-purple-700', 
    badgeBg: 'bg-purple-100 text-purple-800' 
  },
  documents_received: { 
    id: 'documents_received', 
    title: 'Documentation', 
    dot: 'bg-amber-500', 
    bg: 'bg-amber-50/70', 
    border: 'border-amber-200/80', 
    text: 'text-amber-700', 
    badgeBg: 'bg-amber-100 text-amber-800' 
  },
  approved: { 
    id: 'approved', 
    title: 'Approved', 
    dot: 'bg-emerald-500', 
    bg: 'bg-emerald-50/70', 
    border: 'border-emerald-200/80', 
    text: 'text-emerald-700', 
    badgeBg: 'bg-emerald-100 text-emerald-800' 
  },
  closed: { 
    id: 'closed', 
    title: 'Closed / Won', 
    dot: 'bg-slate-500', 
    bg: 'bg-slate-100/70', 
    border: 'border-slate-300', 
    text: 'text-slate-700', 
    badgeBg: 'bg-slate-200 text-slate-800' 
  },
};

export default function KanbanBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || Boolean(user?.permissions?.editLeads);
  const isScopedStaff = user?.role === 'staff' && !user?.permissions?.viewAllLeads;

  const totalLeadsOnBoard = useMemo(() => {
    return Object.values(columns).reduce((sum, col) => sum + (col.items?.length || 0), 0);
  }, [columns]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients?limit=1000');
      const leads = res.data.clients || [];
      
      const initialColumns = Object.keys(STAGES).reduce((acc, key) => {
        acc[key] = {
          ...STAGES[key],
          items: leads.filter(l => l.stage === key)
        };
        return acc;
      }, {});
      
      setColumns(initialColumns);
    } catch (error) {
      toast.error('Failed to load leads for Kanban');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    if (!canEdit) {
      toast.error('You do not have permission to update lead stages');
      return;
    }

    const { source, destination } = result;
    
    // Dropped in same column and same index
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    const sourceItems = [...sourceColumn.items];
    const destItems = source.droppableId === destination.droppableId ? sourceItems : [...destColumn.items];
    
    const [movedItem] = sourceItems.splice(source.index, 1);
    movedItem.stage = destination.droppableId; // optimistic update
    destItems.splice(destination.index, 0, movedItem);
    
    setColumns(prev => ({
      ...prev,
      [source.droppableId]: {
        ...sourceColumn,
        items: sourceItems
      },
      [destination.droppableId]: {
        ...destColumn,
        items: destItems
      }
    }));

    // If stage changed, sync with API
    if (source.droppableId !== destination.droppableId) {
      try {
        await api.put(`/clients/${movedItem._id}`, { stage: destination.droppableId });
        toast.success(`Moved to ${STAGES[destination.droppableId].title}`);
      } catch (err) {
        toast.error('Failed to update lead stage');
        fetchLeads(); // Revert on failure
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return 'L';
  };

  // Filtered columns based on search
  const filteredColumns = useMemo(() => {
    if (!filterQuery.trim()) return columns;
    const q = filterQuery.toLowerCase();
    const result = {};
    for (const [colId, colData] of Object.entries(columns)) {
      result[colId] = {
        ...colData,
        items: (colData.items || []).filter(item => 
          (item.fullName && item.fullName.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q)) ||
          (item.phone && item.phone.includes(q))
        )
      };
    }
    return result;
  }, [columns, filterQuery]);

  // Overall pipeline metrics
  const totalLeadsCount = Object.values(columns).reduce((sum, col) => sum + (col.items?.length || 0), 0);
  const totalPipelineValue = Object.values(columns).reduce((sum, col) => {
    return sum + (col.items || []).reduce((colSum, item) => colSum + (Number(item.loanAmount) || 0), 0);
  }, 0);

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-t-2 border-b-2 border-indigo-600 animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Loading Pipeline Board...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none">
      {/* Top Pipeline Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 shadow-2xs z-20">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Sales Pipeline Board</h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {totalLeadsCount} Leads Total
            </span>
            {totalPipelineValue > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                ${totalPipelineValue.toLocaleString()} Value
              </span>
            )}
          </div>
          <p className="text-slate-400 font-medium text-xs mt-0.5">
            Drag cards across columns to seamlessly update deal stages.
          </p>
        </div>

        {/* Right Tools: Filter, Refresh, Add */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter pipeline cards..."
              className="w-48 sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            onClick={fetchLeads}
            title="Refresh Board"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          {canEdit && (
            <button
              onClick={() => navigate('/leads?action=new')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Alert Banner for Staff when 0 leads assigned */}
      {isScopedStaff && totalLeadsOnBoard === 0 && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base shrink-0">
              🔒
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                No Leads Assigned To You Yet
              </p>
              <p className="text-[11.5px] text-amber-700 mt-0.5">
                Admin jab tak aapke account ko leads assign nahi karega, tab tak aapki pipeline empty rahegi. Admin ke assign karte hi sari leads automatically yahan columns mein show hongi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Board Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5 h-full items-start">
            {Object.entries(filteredColumns).map(([columnId, column]) => {
              const columnTotalVal = (column.items || []).reduce((sum, item) => sum + (Number(item.loanAmount) || 0), 0);
              return (
                <div 
                  key={columnId} 
                  className="flex flex-col flex-shrink-0 w-80 h-full max-h-full bg-slate-100/60 border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs"
                >
                  {/* Column Header */}
                  <div className={`p-3.5 border-b border-slate-200/90 ${column.bg} flex justify-between items-center shrink-0`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${column.dot} ring-2 ring-white shadow-2xs`}></span>
                      <h3 className={`font-bold text-xs ${column.text}`}>{column.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {columnTotalVal > 0 && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200/60">
                          ${columnTotalVal.toLocaleString()}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${column.badgeBg}`}>
                        {column.items.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Droppable Area */}
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${
                          snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        {column.items.length === 0 ? (
                          <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <span className="text-xs font-medium">No leads in this stage</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Drag cards here</span>
                          </div>
                        ) : (
                          column.items.map((item, index) => (
                            <Draggable key={item._id} draggableId={item._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => navigate(`/clients/${item._id}`)}
                                  className={`bg-white p-3.5 rounded-lg mb-2.5 shadow-2xs border border-slate-200/90 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all duration-150 group ${
                                    snapshot.isDragging ? 'rotate-1 scale-105 shadow-xl z-50 ring-2 ring-indigo-500' : ''
                                  }`}
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  {/* Lead Header */}
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] border border-slate-200">
                                        {getInitials(item.fullName)}
                                      </div>
                                      <h4 className="font-bold text-xs text-slate-900 truncate max-w-[170px] group-hover:text-indigo-600 transition-colors" title={item.fullName}>
                                        {item.fullName || 'Untitled Lead'}
                                      </h4>
                                    </div>
                                    {item.source && (
                                      <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                        {item.source}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Contact Details */}
                                  <div className="space-y-1 mb-2.5">
                                    {item.visaDetails?.visaType && (
                                      <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded truncate w-max max-w-full mb-1">
                                        {item.visaDetails.targetCountry ? `${item.visaDetails.targetCountry} • ` : ''}{item.visaDetails.visaType}
                                      </div>
                                    )}
                                    {item.email && item.email !== 'N/A' && (
                                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                                        <EnvelopeIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{item.email}</span>
                                      </div>
                                    )}
                                    {item.phone && item.phone !== 'N/A' && (
                                      <div className="text-[11px] font-medium text-slate-700 truncate flex items-center gap-1.5">
                                        <PhoneIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>{item.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Footer with Deal Value */}
                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-[10px] font-medium text-slate-400 truncate max-w-[130px]">
                                      {item.metaData?.formName || 'Manual Entry'}
                                    </div>
                                    {item.loanAmount ? (
                                      <div className="text-xs font-extrabold text-emerald-600 flex items-center">
                                        ${Number(item.loanAmount).toLocaleString()}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-400 italic">
                                        No value
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
