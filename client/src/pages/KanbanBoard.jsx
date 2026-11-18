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
  UserGroupIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon
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
  const canDelete = isAdmin || Boolean(user?.permissions?.deleteLeads);
  const isScopedStaff = user?.role === 'staff' && !user?.permissions?.viewAllLeads;

  // Team members list for assignment
  const [teamMembers, setTeamMembers] = useState([]);

  // Add Card State
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [targetAddStage, setTargetAddStage] = useState('new_lead');
  const [newCardData, setNewCardData] = useState({
    fullName: '',
    email: '',
    phone: '',
    loanAmount: '',
    stage: 'new_lead',
    source: 'manual',
    targetCountry: 'Canada',
    visaType: 'Study Visa',
    assignedTo: ''
  });
  const [savingNewCard, setSavingNewCard] = useState(false);

  // Edit Card State
  const [editingCard, setEditingCard] = useState(null);
  const [editCardData, setEditCardData] = useState({});
  const [savingEditCard, setSavingEditCard] = useState(false);

  // Delete Card State
  const [cardToDelete, setCardToDelete] = useState(null);
  const [deletingCard, setDeletingCard] = useState(false);

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

    api.get('/auth/team-members')
      .then(res => {
        if (res.data?.success) setTeamMembers(res.data.users || []);
      })
      .catch(err => console.error('Failed to load team members for Kanban:', err));
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

  // Add Card Handlers
  const handleOpenAddCard = (stageId = 'new_lead') => {
    setTargetAddStage(stageId);
    setNewCardData({
      fullName: '',
      email: '',
      phone: '',
      loanAmount: '',
      stage: stageId,
      source: 'manual',
      targetCountry: 'Canada',
      visaType: 'Study Visa',
      assignedTo: ''
    });
    setIsAddCardModalOpen(true);
  };

  const handleCreateCard = async (e) => {
    if (e) e.preventDefault();
    if (!newCardData.fullName.trim()) {
      return toast.error('Lead full name is required');
    }

    setSavingNewCard(true);
    const tId = toast.loading('Adding lead card...');
    try {
      const payload = {
        fullName: newCardData.fullName.trim(),
        email: newCardData.email ? newCardData.email.trim() : undefined,
        phone: newCardData.phone ? newCardData.phone.trim() : undefined,
        loanAmount: newCardData.loanAmount ? Number(newCardData.loanAmount) : undefined,
        stage: newCardData.stage || targetAddStage,
        source: newCardData.source || 'manual',
        visaDetails: {
          targetCountry: newCardData.targetCountry || 'Canada',
          visaType: newCardData.visaType || 'Study Visa'
        },
        assignedTo: newCardData.assignedTo || undefined
      };

      const res = await api.post('/clients', payload);
      if (res.data?.success) {
        toast.success(`Card '${payload.fullName}' added successfully!`, { id: tId });
        setIsAddCardModalOpen(false);
        fetchLeads();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add card', { id: tId });
    } finally {
      setSavingNewCard(false);
    }
  };

  // Edit Card Handlers
  const handleOpenEditCard = (card) => {
    setEditingCard(card);
    setEditCardData({
      fullName: card.fullName || '',
      email: card.email && card.email !== 'N/A' ? card.email : '',
      phone: card.phone && card.phone !== 'N/A' ? card.phone : '',
      loanAmount: card.loanAmount || '',
      stage: card.stage || 'new_lead',
      targetCountry: card.visaDetails?.targetCountry || 'Canada',
      visaType: card.visaDetails?.visaType || 'Study Visa',
      assignedTo: card.assignedTo?._id || card.assignedTo || ''
    });
  };

  const handleSaveEditCard = async (e) => {
    if (e) e.preventDefault();
    if (!editCardData.fullName?.trim()) {
      return toast.error('Lead name is required');
    }

    setSavingEditCard(true);
    const tId = toast.loading('Saving card updates...');
    try {
      const payload = {
        fullName: editCardData.fullName.trim(),
        email: editCardData.email ? editCardData.email.trim() : '',
        phone: editCardData.phone ? editCardData.phone.trim() : '',
        loanAmount: editCardData.loanAmount !== '' ? Number(editCardData.loanAmount) : undefined,
        stage: editCardData.stage,
        visaDetails: {
          ...(editingCard.visaDetails || {}),
          targetCountry: editCardData.targetCountry,
          visaType: editCardData.visaType
        },
        assignedTo: editCardData.assignedTo || null
      };

      const res = await api.put(`/clients/${editingCard._id}`, payload);
      if (res.data?.success) {
        toast.success(`Card '${payload.fullName}' updated!`, { id: tId });
        setEditingCard(null);
        fetchLeads();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update card', { id: tId });
    } finally {
      setSavingEditCard(false);
    }
  };

  // Delete Card Handler
  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    setDeletingCard(true);
    const tId = toast.loading(`Deleting '${cardToDelete.fullName}'...`);
    try {
      const res = await api.delete(`/clients/${cardToDelete._id}`);
      if (res.data?.success) {
        toast.success(res.data.message || `Deleted card '${cardToDelete.fullName}'`, { id: tId });
        setCardToDelete(null);
        fetchLeads();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete card', { id: tId });
    } finally {
      setDeletingCard(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return 'L';
  };

  // Filter columns based on user search
  const filteredColumns = useMemo(() => {
    if (!filterQuery) return columns;
    const q = filterQuery.toLowerCase();
    
    return Object.keys(columns).reduce((acc, colId) => {
      acc[colId] = {
        ...columns[colId],
        items: columns[colId].items.filter(item => 
          (item.fullName && item.fullName.toLowerCase().includes(q)) ||
          (item.email && item.email.toLowerCase().includes(q)) ||
          (item.phone && item.phone.includes(q)) ||
          (item.visaDetails?.visaType && item.visaDetails.visaType.toLowerCase().includes(q))
        )
      };
      return acc;
    }, {});
  }, [columns, filterQuery]);

  const totalPipelineValue = useMemo(() => {
    return Object.values(columns).reduce((sum, col) => {
      const colSum = (col.items || []).reduce((acc, item) => acc + (Number(item.loanAmount) || 0), 0);
      return sum + colSum;
    }, 0);
  }, [columns]);

  if (loading && Object.keys(columns).length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Kanban Board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pipeline Board</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {totalLeadsOnBoard} Opportunities
            </span>
            {totalPipelineValue > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                ${totalPipelineValue.toLocaleString()} Value
              </span>
            )}
          </div>
          <p className="text-slate-400 font-medium text-xs mt-0.5">
            Add cards, update lead stages, and manage deal progression.
          </p>
        </div>

        {/* Right Tools: Filter, Refresh, Add Card */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter cards by name, email, phone..."
              className="w-48 sm:w-60 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            onClick={fetchLeads}
            title="Refresh Board"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          {canEdit && (
            <button
              onClick={() => handleOpenAddCard('new_lead')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Card</span>
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
                        className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors flex flex-col justify-between ${
                          snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <div>
                          {column.items.length === 0 ? (
                            <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                              <span className="text-xs font-medium">No leads in this stage</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Drag cards here or add new</span>
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
                                    className={`bg-white p-3.5 rounded-xl mb-2.5 shadow-2xs border border-slate-200/90 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all duration-150 group relative ${
                                      snapshot.isDragging ? 'rotate-1 scale-105 shadow-xl z-50 ring-2 ring-indigo-500' : ''
                                    }`}
                                    style={{ ...provided.draggableProps.style }}
                                  >
                                    {/* Lead Header */}
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] border border-slate-200 shrink-0">
                                          {getInitials(item.fullName)}
                                        </div>
                                        <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-indigo-600 transition-colors" title={item.fullName}>
                                          {item.fullName || 'Untitled Lead'}
                                        </h4>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        {item.source && (
                                          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            {item.source}
                                          </span>
                                        )}

                                        {/* Edit Card Button */}
                                        {canEdit && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenEditCard(item);
                                            }}
                                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                            title="Edit card"
                                          >
                                            <PencilSquareIcon className="w-3.5 h-3.5" />
                                          </button>
                                        )}

                                        {/* Delete Card Button */}
                                        {canDelete && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCardToDelete(item);
                                            }}
                                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                            title="Delete card"
                                          >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Contact & Category Details */}
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
                                      {item.assignedTo && (
                                        <div className="pt-0.5">
                                          <span className="text-[9.5px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/70 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                                            <UserIcon className="w-2.5 h-2.5 text-slate-400" />
                                            <span className="truncate max-w-[140px]">{item.assignedTo.name || 'Assigned Staff'}</span>
                                          </span>
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

                        {/* Add Card to Column Button */}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenAddCard(columnId)}
                            className="w-full mt-2.5 py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-white text-slate-500 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                          >
                            <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>+ Add Card</span>
                          </button>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* MODAL 1: ADD CARD MODAL */}
      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <PlusIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Lead Card</h3>
                  <p className="text-xs text-slate-500">Create a new opportunity card in your pipeline.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Varinder Singh"
                  value={newCardData.fullName}
                  onChange={(e) => setNewCardData({ ...newCardData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={newCardData.email}
                    onChange={(e) => setNewCardData({ ...newCardData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 778 000 0000"
                    value={newCardData.phone}
                    onChange={(e) => setNewCardData({ ...newCardData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={newCardData.stage}
                    onChange={(e) => setNewCardData({ ...newCardData, stage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer bg-white"
                  >
                    {Object.values(STAGES).map(st => (
                      <option key={st.id} value={st.id}>{st.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deal / Visa Value ($)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={newCardData.loanAmount}
                    onChange={(e) => setNewCardData({ ...newCardData, loanAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Canada"
                    value={newCardData.targetCountry}
                    onChange={(e) => setNewCardData({ ...newCardData, targetCountry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Visa Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Study Visa, Work Permit"
                    value={newCardData.visaType}
                    onChange={(e) => setNewCardData({ ...newCardData, visaType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Staff Member
                </label>
                <select
                  value={newCardData.assignedTo}
                  onChange={(e) => setNewCardData({ ...newCardData, assignedTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer bg-white"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} {m.role === 'admin' ? '(Admin)' : '(Staff)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCardModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewCard}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingNewCard && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingNewCard ? 'Adding Card...' : 'Add Card to Pipeline'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CARD MODAL */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <PencilSquareIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Lead Card</h3>
                  <p className="text-xs text-slate-500">Update opportunity details and pipeline stage.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCard(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCard} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCardData.fullName}
                  onChange={(e) => setEditCardData({ ...editCardData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editCardData.email}
                    onChange={(e) => setEditCardData({ ...editCardData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editCardData.phone}
                    onChange={(e) => setEditCardData({ ...editCardData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={editCardData.stage}
                    onChange={(e) => setEditCardData({ ...editCardData, stage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer bg-white"
                  >
                    {Object.values(STAGES).map(st => (
                      <option key={st.id} value={st.id}>{st.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deal / Visa Value ($)
                  </label>
                  <input
                    type="number"
                    value={editCardData.loanAmount}
                    onChange={(e) => setEditCardData({ ...editCardData, loanAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Country
                  </label>
                  <input
                    type="text"
                    value={editCardData.targetCountry}
                    onChange={(e) => setEditCardData({ ...editCardData, targetCountry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Visa Category
                  </label>
                  <input
                    type="text"
                    value={editCardData.visaType}
                    onChange={(e) => setEditCardData({ ...editCardData, visaType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Staff Member
                </label>
                <select
                  value={editCardData.assignedTo}
                  onChange={(e) => setEditCardData({ ...editCardData, assignedTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer bg-white"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} {m.role === 'admin' ? '(Admin)' : '(Staff)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditCard}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingEditCard && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingEditCard ? 'Saving...' : 'Save Card Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CARD CONFIRMATION */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <TrashIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Lead Card</h3>
                  <p className="text-xs text-slate-500">Remove this opportunity from pipeline.</p>
                </div>
              </div>
              <button
                onClick={() => setCardToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              <p className="text-sm text-slate-700 font-medium">
                Are you sure you want to permanently delete lead card for <strong className="text-slate-900">{cardToDelete.fullName}</strong>?
              </p>
              <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                ⚠️ This will permanently remove this lead card from your pipeline.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingCard}
                onClick={handleDeleteCard}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deletingCard && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingCard ? 'Deleting...' : 'Yes, Delete Card'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
