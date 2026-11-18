import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, GlobeAltIcon } from '@heroicons/react/24/solid';

const COLOR_CONFIG = {
  blue: { 
    id: 'blue',
    name: 'Blue',
    dot: 'bg-blue-500', 
    bg: 'bg-blue-50/70', 
    border: 'border-blue-200/80', 
    text: 'text-blue-700', 
    badgeBg: 'bg-blue-100 text-blue-800',
    swatch: 'bg-blue-500 ring-blue-300'
  },
  indigo: { 
    id: 'indigo',
    name: 'Indigo',
    dot: 'bg-indigo-500', 
    bg: 'bg-indigo-50/70', 
    border: 'border-indigo-200/80', 
    text: 'text-indigo-700', 
    badgeBg: 'bg-indigo-100 text-indigo-800',
    swatch: 'bg-indigo-500 ring-indigo-300'
  },
  purple: { 
    id: 'purple',
    name: 'Purple',
    dot: 'bg-purple-500', 
    bg: 'bg-purple-50/70', 
    border: 'border-purple-200/80', 
    text: 'text-purple-700', 
    badgeBg: 'bg-purple-100 text-purple-800',
    swatch: 'bg-purple-500 ring-purple-300'
  },
  amber: { 
    id: 'amber',
    name: 'Amber',
    dot: 'bg-amber-500', 
    bg: 'bg-amber-50/70', 
    border: 'border-amber-200/80', 
    text: 'text-amber-700', 
    badgeBg: 'bg-amber-100 text-amber-800',
    swatch: 'bg-amber-500 ring-amber-300'
  },
  emerald: { 
    id: 'emerald',
    name: 'Emerald',
    dot: 'bg-emerald-500', 
    bg: 'bg-emerald-50/70', 
    border: 'border-emerald-200/80', 
    text: 'text-emerald-700', 
    badgeBg: 'bg-emerald-100 text-emerald-800',
    swatch: 'bg-emerald-500 ring-emerald-300'
  },
  rose: { 
    id: 'rose',
    name: 'Rose',
    dot: 'bg-rose-500', 
    bg: 'bg-rose-50/70', 
    border: 'border-rose-200/80', 
    text: 'text-rose-700', 
    badgeBg: 'bg-rose-100 text-rose-800',
    swatch: 'bg-rose-500 ring-rose-300'
  },
  teal: { 
    id: 'teal',
    name: 'Teal',
    dot: 'bg-teal-500', 
    bg: 'bg-teal-50/70', 
    border: 'border-teal-200/80', 
    text: 'text-teal-700', 
    badgeBg: 'bg-teal-100 text-teal-800',
    swatch: 'bg-teal-500 ring-teal-300'
  },
  cyan: { 
    id: 'cyan',
    name: 'Cyan',
    dot: 'bg-cyan-500', 
    bg: 'bg-cyan-50/70', 
    border: 'border-cyan-200/80', 
    text: 'text-cyan-700', 
    badgeBg: 'bg-cyan-100 text-cyan-800',
    swatch: 'bg-cyan-500 ring-cyan-300'
  },
  violet: { 
    id: 'violet',
    name: 'Violet',
    dot: 'bg-violet-500', 
    bg: 'bg-violet-50/70', 
    border: 'border-violet-200/80', 
    text: 'text-violet-700', 
    badgeBg: 'bg-violet-100 text-violet-800',
    swatch: 'bg-violet-500 ring-violet-300'
  },
  sky: { 
    id: 'sky',
    name: 'Sky',
    dot: 'bg-sky-500', 
    bg: 'bg-sky-50/70', 
    border: 'border-sky-200/80', 
    text: 'text-sky-700', 
    badgeBg: 'bg-sky-100 text-sky-800',
    swatch: 'bg-sky-500 ring-sky-300'
  },
  orange: { 
    id: 'orange',
    name: 'Orange',
    dot: 'bg-orange-500', 
    bg: 'bg-orange-50/70', 
    border: 'border-orange-200/80', 
    text: 'text-orange-700', 
    badgeBg: 'bg-orange-100 text-orange-800',
    swatch: 'bg-orange-500 ring-orange-300'
  },
  slate: { 
    id: 'slate',
    name: 'Slate',
    dot: 'bg-slate-500', 
    bg: 'bg-slate-100/70', 
    border: 'border-slate-300', 
    text: 'text-slate-700', 
    badgeBg: 'bg-slate-200 text-slate-800',
    swatch: 'bg-slate-500 ring-slate-300'
  },
};

export default function KanbanBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || Boolean(user?.permissions?.editLeads);
  const canDelete = isAdmin || Boolean(user?.permissions?.deleteLeads);
  const isScopedStaff = user?.role === 'staff' && !user?.permissions?.viewAllLeads;

  // Team members list for assignment
  const [teamMembers, setTeamMembers] = useState([]);

  // ==================== STAGE / COLUMN MANAGEMENT STATE ====================
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [newStageData, setNewStageData] = useState({ title: '', color: 'blue' });
  const [savingNewStage, setSavingNewStage] = useState(false);

  const [editingStage, setEditingStage] = useState(null);
  const [editStageData, setEditStageData] = useState({ title: '', color: 'blue' });
  const [savingEditStage, setSavingEditStage] = useState(false);

  const [stageToDelete, setStageToDelete] = useState(null);
  const [fallbackStageKey, setFallbackStageKey] = useState('');
  const [deletingStage, setDeletingStage] = useState(false);

  // ==================== CARD MANAGEMENT STATE ====================
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [targetAddStage, setTargetAddStage] = useState('');
  const [newCardData, setNewCardData] = useState({
    fullName: '',
    email: '',
    phone: '',
    loanAmount: '',
    stage: '',
    source: 'manual',
    targetCountry: 'Canada',
    visaType: 'Study Visa',
    assignedTo: ''
  });
  const [savingNewCard, setSavingNewCard] = useState(false);

  const [editingCard, setEditingCard] = useState(null);
  const [editCardData, setEditCardData] = useState({});
  const [savingEditCard, setSavingEditCard] = useState(false);

  const [cardToDelete, setCardToDelete] = useState(null);
  const [deletingCard, setDeletingCard] = useState(false);

  const totalLeadsOnBoard = useMemo(() => {
    return Object.values(columns).reduce((sum, col) => sum + (col.items?.length || 0), 0);
  }, [columns]);

  // Load Stages & Clients
  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const [stagesRes, clientsRes] = await Promise.all([
        api.get('/stages'),
        api.get('/clients?limit=1000')
      ]);

      const fetchedStages = stagesRes.data?.stages || [];
      const fetchedClients = clientsRes.data?.clients || [];

      setStages(fetchedStages);

      // Build column structure from stages
      const colsMap = {};
      fetchedStages.forEach((st) => {
        const styling = COLOR_CONFIG[st.color] || COLOR_CONFIG.blue;
        colsMap[st.key] = {
          _id: st._id,
          id: st.key,
          key: st.key,
          title: st.title,
          color: st.color || 'blue',
          order: st.order,
          isDefault: st.isDefault,
          ...styling,
          items: []
        };
      });

      // Distribute leads into columns
      const defaultStageKey = fetchedStages[0]?.key || 'new_lead';
      fetchedClients.forEach((lead) => {
        const colKey = lead.stage && colsMap[lead.stage] ? lead.stage : defaultStageKey;
        if (colsMap[colKey]) {
          colsMap[colKey].items.push(lead);
        }
      });

      setColumns(colsMap);
    } catch (err) {
      console.error('Failed to load board data:', err);
      toast.error('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();

    api.get('/auth/team-members')
      .then((res) => {
        if (res.data?.success) setTeamMembers(res.data.users || []);
      })
      .catch((err) => console.error('Failed to load team members:', err));
  }, []);

  // ==================== DRAG & DROP HANDLER ====================
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (!canEdit) {
      return toast.error('You do not have permission to update lead stages');
    }

    const startCol = columns[source.droppableId];
    const finishCol = columns[destination.droppableId];

    if (!startCol || !finishCol) return;

    if (startCol === finishCol) {
      const newItems = Array.from(startCol.items);
      const [movedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedItem);

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...startCol,
          items: newItems
        }
      });
      return;
    }

    // Move to different column
    const startItems = Array.from(startCol.items);
    const [movedItem] = startItems.splice(source.index, 1);
    const finishItems = Array.from(finishCol.items);
    finishItems.splice(destination.index, 0, { ...movedItem, stage: destination.droppableId });

    setColumns({
      ...columns,
      [source.droppableId]: {
        ...startCol,
        items: startItems
      },
      [destination.droppableId]: {
        ...finishCol,
        items: finishItems
      }
    });

    try {
      await api.patch(`/clients/${draggableId}`, { stage: destination.droppableId });
      toast.success(`Moved to ${finishCol.title}`);
    } catch (err) {
      console.error('Failed to update stage on drag:', err);
      toast.error('Failed to move lead stage');
      fetchBoardData();
    }
  };

  // ==================== STAGE / COLUMN HANDLERS ====================
  const handleOpenAddStage = () => {
    setNewStageData({ title: '', color: 'blue' });
    setIsAddStageModalOpen(true);
  };

  const handleCreateStage = async (e) => {
    if (e) e.preventDefault();
    if (!newStageData.title.trim()) {
      return toast.error('Column name is required');
    }

    setSavingNewStage(true);
    const tId = toast.loading('Adding new column...');
    try {
      const res = await api.post('/stages', {
        title: newStageData.title.trim(),
        color: newStageData.color || 'blue'
      });

      if (res.data?.success) {
        toast.success(`Column '${newStageData.title}' added!`, { id: tId });
        setIsAddStageModalOpen(false);
        fetchBoardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add column', { id: tId });
    } finally {
      setSavingNewStage(false);
    }
  };

  const handleOpenEditStage = (col) => {
    setEditingStage(col);
    setEditStageData({
      title: col.title || '',
      color: col.color || 'blue'
    });
  };

  const handleSaveEditStage = async (e) => {
    if (e) e.preventDefault();
    if (!editingStage) return;
    if (!editStageData.title.trim()) {
      return toast.error('Column name is required');
    }

    setSavingEditStage(true);
    const tId = toast.loading('Updating column...');
    try {
      const res = await api.put(`/stages/${editingStage._id}`, {
        title: editStageData.title.trim(),
        color: editStageData.color
      });

      if (res.data?.success) {
        toast.success(`Column '${editStageData.title}' updated!`, { id: tId });
        setEditingStage(null);
        fetchBoardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update column', { id: tId });
    } finally {
      setSavingEditStage(false);
    }
  };

  const handleOpenDeleteStage = (col) => {
    const remainingStages = stages.filter((s) => s.key !== col.key);
    setStageToDelete(col);
    setFallbackStageKey(remainingStages[0]?.key || '');
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;
    setDeletingStage(true);
    const tId = toast.loading(`Deleting column '${stageToDelete.title}'...`);
    try {
      const res = await api.delete(`/stages/${stageToDelete._id}`, {
        data: { fallbackStageKey }
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Column deleted successfully!`, { id: tId });
        setStageToDelete(null);
        fetchBoardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete column', { id: tId });
    } finally {
      setDeletingStage(false);
    }
  };

  // ==================== CARD HANDLERS ====================
  const handleOpenAddCard = (stageId) => {
    const target = stageId || stages[0]?.key || 'new_lead';
    setTargetAddStage(target);
    setNewCardData({
      fullName: '',
      email: '',
      phone: '',
      loanAmount: '',
      stage: target,
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
        fetchBoardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add card', { id: tId });
    } finally {
      setSavingNewCard(false);
    }
  };

  const handleOpenEditCard = (card) => {
    setEditingCard(card);
    setEditCardData({
      fullName: card.fullName || '',
      email: card.email && card.email !== 'N/A' ? card.email : '',
      phone: card.phone && card.phone !== 'N/A' ? card.phone : '',
      loanAmount: card.loanAmount || '',
      stage: card.stage || stages[0]?.key || 'new_lead',
      targetCountry: card.visaDetails?.targetCountry || 'Canada',
      visaType: card.visaDetails?.visaType || 'Study Visa',
      assignedTo: card.assignedTo?._id || card.assignedTo || ''
    });
  };

  const handleSaveEditCard = async (e) => {
    if (e) e.preventDefault();
    if (!editingCard) return;
    if (!editCardData.fullName.trim()) {
      return toast.error('Lead full name is required');
    }

    setSavingEditCard(true);
    const tId = toast.loading('Saving card changes...');
    try {
      const payload = {
        fullName: editCardData.fullName.trim(),
        email: editCardData.email ? editCardData.email.trim() : '',
        phone: editCardData.phone ? editCardData.phone.trim() : '',
        loanAmount: editCardData.loanAmount ? Number(editCardData.loanAmount) : 0,
        stage: editCardData.stage,
        visaDetails: {
          ...(editingCard.visaDetails || {}),
          targetCountry: editCardData.targetCountry || 'Canada',
          visaType: editCardData.visaType || 'Study Visa'
        },
        assignedTo: editCardData.assignedTo || null
      };

      const res = await api.put(`/clients/${editingCard._id}`, payload);
      if (res.data?.success) {
        toast.success('Card updated successfully!', { id: tId });
        setEditingCard(null);
        fetchBoardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update card', { id: tId });
    } finally {
      setSavingEditCard(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    setDeletingCard(true);
    const tId = toast.loading(`Deleting '${cardToDelete.fullName}'...`);
    try {
      const res = await api.delete(`/clients/${cardToDelete._id}`);
      if (res.data?.success) {
        toast.success(res.data.message || `Deleted card '${cardToDelete.fullName}'`, { id: tId });
        setCardToDelete(null);
        fetchBoardData();
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
        items: (columns[colId].items || []).filter(
          (item) =>
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
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Pipeline Board...</p>
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
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {Object.keys(columns).length} Stages
            </span>
            {totalPipelineValue > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                ${totalPipelineValue.toLocaleString()} Value
              </span>
            )}
          </div>
          <p className="text-slate-400 font-medium text-xs mt-0.5">
            Add or edit columns, create cards, and manage deal progression.
          </p>
        </div>

        {/* Right Tools */}
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
            onClick={fetchBoardData}
            title="Refresh Board"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenAddStage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Column</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => handleOpenAddCard(stages[0]?.key || 'new_lead')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Card</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Banner for Scoped Staff when 0 leads assigned */}
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

      {/* Board Horizontal Scroll Area */}
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
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${column.dot} ring-2 ring-white shadow-2xs shrink-0`}></span>
                      <h3 className={`font-bold text-xs ${column.text} truncate`} title={column.title}>
                        {column.title}
                      </h3>

                      {/* Admin Column Edit / Delete Action Buttons */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-1 opacity-70 hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Edit Column / Rename"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditStage(column);
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded transition-all cursor-pointer"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Column"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteStage(column);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white/80 rounded transition-all cursor-pointer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
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

                  {/* Cards Scrollable Droppable Area */}
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar transition-colors ${
                          snapshot.isDraggingOver ? 'bg-indigo-50/40 ring-1 ring-indigo-300 ring-inset' : ''
                        }`}
                      >
                        {column.items.length === 0 ? (
                          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/70 rounded-xl text-center p-4">
                            <span className="text-xs font-semibold text-slate-400">No leads in this stage</span>
                            <span className="text-[10px] text-slate-400/80 mt-0.5">Drag cards here or add new</span>
                          </div>
                        ) : (
                          column.items.map((item, index) => {
                            const isMeta = item.source === 'facebook' || item.source === 'instagram' || item.platformContactId;
                            const isWhatsApp = item.source === 'whatsapp';
                            const sourceLabel = isMeta ? 'FACEBOOK' : (item.source || 'MANUAL').toUpperCase();

                            return (
                              <Draggable key={item._id} draggableId={item._id} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => navigate(`/clients/${item._id}`)}
                                    className={`bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group hover:border-slate-300 relative ${
                                      dragSnapshot.isDragging ? 'shadow-xl ring-2 ring-indigo-500 rotate-1' : ''
                                    }`}
                                  >
                                    {/* Card Header: Avatar, Name, Source Badge, Edit/Delete Buttons */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                          {getInitials(item.fullName)}
                                        </div>
                                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                          {item.fullName}
                                        </h4>
                                      </div>

                                      {/* Right corner of card */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                                          {sourceLabel}
                                        </span>

                                        {/* Edit Card Button */}
                                        {canEdit && (
                                          <button
                                            type="button"
                                            title="Edit Lead Card"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenEditCard(item);
                                            }}
                                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                          >
                                            <PencilSquareIcon className="w-3.5 h-3.5" />
                                          </button>
                                        )}

                                        {/* Delete Card Button */}
                                        {canDelete && (
                                          <button
                                            type="button"
                                            title="Delete Lead Card"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCardToDelete(item);
                                            }}
                                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                          >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-1 my-2">
                                      {item.email && item.email !== 'N/A' && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                                          <EnvelopeIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{item.email}</span>
                                        </div>
                                      )}
                                      {item.phone && item.phone !== 'N/A' && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                                          <PhoneIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{item.phone}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Assigned Staff Badge */}
                                    {item.assignedTo && (
                                      <div className="my-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 w-fit max-w-full truncate">
                                        <UserIcon className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="truncate">
                                          {typeof item.assignedTo === 'object' ? item.assignedTo.name : 'Assigned'}
                                        </span>
                                      </div>
                                    )}

                                    {/* Card Footer */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                      <span className="font-medium text-slate-400 text-[10px]">
                                        {item.visaDetails?.visaType || 'Manual Entry'}
                                      </span>
                                      {item.loanAmount ? (
                                        <span className="font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                                          ${Number(item.loanAmount).toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-300 italic">No value</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  </div>
              );
            })}

            {/* + ADD COLUMN CARD AT END OF BOARD (Admin Only) */}
            {isAdmin && (
              <div className="shrink-0 w-80">
                <button
                  type="button"
                  onClick={handleOpenAddStage}
                  className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/60 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center text-slate-600 group-hover:text-indigo-600 transition-colors">
                    <PlusIcon className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span>+ Add New Column</span>
                  <span className="text-[10px] text-slate-400 font-normal">Create custom pipeline stage</span>
                </button>
              </div>
            )}
          </div>
        </DragDropContext>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW COLUMN / STAGE (Admin Only) */}
      {/* ========================================================= */}
      {isAddStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <PlusIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Pipeline Column</h3>
                  <p className="text-xs text-slate-500">Create a new stage for your deal flow.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStage} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Column / Stage Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assessment, Interview, Medical, Review"
                  value={newStageData.title}
                  onChange={(e) => setNewStageData({ ...newStageData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Header Color Theme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(COLOR_CONFIG).map((cfg) => {
                    const isSelected = (newStageData.color || 'blue') === cfg.id;
                    return (
                      <button
                        key={cfg.id}
                        type="button"
                        onClick={() => setNewStageData({ ...newStageData, color: cfg.id })}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-900'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${cfg.dot} shrink-0`}></span>
                        <span className="truncate">{cfg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStageModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewStage}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingNewStage && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingNewStage ? 'Adding...' : 'Create Column'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT COLUMN / STAGE (Admin Only) */}
      {/* ========================================================= */}
      {editingStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <PencilSquareIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Column: {editingStage.title}</h3>
                  <p className="text-xs text-slate-500">Update stage title or theme color.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStage} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Column Name *
                </label>
                <input
                  type="text"
                  required
                  value={editStageData.title}
                  onChange={(e) => setEditStageData({ ...editStageData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Header Color Theme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(COLOR_CONFIG).map((cfg) => {
                    const isSelected = (editStageData.color || 'blue') === cfg.id;
                    return (
                      <button
                        key={cfg.id}
                        type="button"
                        onClick={() => setEditStageData({ ...editStageData, color: cfg.id })}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-900'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${cfg.dot} shrink-0`}></span>
                        <span className="truncate">{cfg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditStage}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingEditStage && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingEditStage ? 'Saving...' : 'Save Column Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE COLUMN / STAGE CONFIRMATION (Admin Only) */}
      {/* ========================================================= */}
      {stageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <TrashIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Column</h3>
                  <p className="text-xs text-slate-500">Remove this column from your pipeline.</p>
                </div>
              </div>
              <button
                onClick={() => setStageToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-slate-700 font-medium">
                Are you sure you want to permanently delete column <strong className="text-slate-900">{stageToDelete.title}</strong>?
              </p>

              {/* Check if cards are present */}
              {stageToDelete.items?.length > 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    ⚠️ This column currently contains {stageToDelete.items.length} leads!
                  </p>
                  <p className="text-xs text-amber-700">
                    Please select where to move these existing leads before deleting this column:
                  </p>
                  <select
                    value={fallbackStageKey}
                    onChange={(e) => setFallbackStageKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {stages
                      .filter((s) => s.key !== stageToDelete.key)
                      .map((s) => (
                        <option key={s.key} value={s.key}>
                          Move to {s.title}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-slate-500">This column is empty. No leads will be affected.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStageToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingStage}
                onClick={handleDeleteStage}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deletingStage && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingStage ? 'Deleting...' : 'Yes, Delete Column'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD CARD MODAL */}
      {/* ========================================================= */}
      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <PlusIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Lead Card</h3>
                  <p className="text-xs text-slate-500">Create and place a new lead in your pipeline.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newCardData.fullName}
                  onChange={(e) => setNewCardData({ ...newCardData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@example.com"
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
                    type="tel"
                    placeholder="+1 555-0199"
                    value={newCardData.phone}
                    onChange={(e) => setNewCardData({ ...newCardData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newCardData.stage}
                    onChange={(e) => setNewCardData({ ...newCardData, stage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer bg-white"
                  >
                    {stages.map((st) => (
                      <option key={st.key} value={st.key}>
                        {st.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deal Value ($)
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="Canada"
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
                    placeholder="Study Visa"
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
                  {teamMembers.map((m) => (
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
                  <span>{savingNewCard ? 'Adding...' : 'Create Card'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: EDIT CARD MODAL */}
      {/* ========================================================= */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <PencilSquareIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Lead Card</h3>
                  <p className="text-xs text-slate-500">Update card information, stage, or assignment.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCard(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCard} className="py-4 space-y-3.5">
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

              <div className="grid grid-cols-2 gap-3">
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
                    type="tel"
                    value={editCardData.phone}
                    onChange={(e) => setEditCardData({ ...editCardData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={editCardData.stage}
                    onChange={(e) => setEditCardData({ ...editCardData, stage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer bg-white"
                  >
                    {stages.map((st) => (
                      <option key={st.key} value={st.key}>
                        {st.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deal Value ($)
                  </label>
                  <input
                    type="number"
                    value={editCardData.loanAmount}
                    onChange={(e) => setEditCardData({ ...editCardData, loanAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Country
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
                  {teamMembers.map((m) => (
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

      {/* ========================================================= */}
      {/* MODAL 6: DELETE CARD CONFIRMATION */}
      {/* ========================================================= */}
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
