import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { FireIcon } from '@heroicons/react/24/outline';

const STAGES = {
  new_lead: { id: 'new_lead', title: 'New Opportunity', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', headBg: 'bg-blue-100/50' },
  contacted: { id: 'contacted', title: 'Contacted', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', headBg: 'bg-indigo-100/50' },
  interested: { id: 'interested', title: 'Negotiation', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', headBg: 'bg-purple-100/50' },
  documents_received: { id: 'documents_received', title: 'Documentation', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', headBg: 'bg-amber-100/50' },
  approved: { id: 'approved', title: 'Approved', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', headBg: 'bg-emerald-100/50' },
  closed: { id: 'closed', title: 'Closed/Won', bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', headBg: 'bg-slate-200/50' },
};

export default function KanbanBoard() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);

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
    
    const { source, destination, draggableId } = result;
    
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
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-30 shrink-0">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Pipeline View</h1>
          <p className="text-slate-500 font-medium text-[13px] mt-1">
            Drag and drop leads to update their pipeline stage.
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {Object.entries(columns).map(([columnId, column]) => (
              <div key={columnId} className="flex flex-col flex-shrink-0 w-80 h-full max-h-full bg-slate-100/50 border border-slate-200 rounded-xl overflow-hidden">
                <div className={`p-4 border-b border-slate-200 ${column.headBg} flex justify-between items-center shrink-0`}>
                  <h3 className={`font-bold text-sm ${column.text}`}>{column.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${column.bg} ${column.text} border ${column.border}`}>
                    {column.items.length}
                  </span>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${
                        snapshot.isDraggingOver ? 'bg-slate-200/50' : ''
                      }`}
                    >
                      {column.items.map((item, index) => (
                        <Draggable key={item._id} draggableId={item._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/clients/${item._id}`)}
                              className={`bg-white p-4 rounded-lg mb-3 shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all ${
                                snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl z-50' : ''
                              }`}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center text-[10px] ring-1 ring-slate-200">
                                    {getInitials(item.fullName)}
                                  </div>
                                  <h4 className="font-semibold text-sm text-slate-900 truncate max-w-[150px]" title={item.fullName}>
                                    {item.fullName}
                                  </h4>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                {item.email && item.email !== 'N/A' && (
                                  <div className="text-xs text-slate-500 truncate">{item.email}</div>
                                )}
                                {item.phone && item.phone !== 'N/A' && (
                                  <div className="text-xs font-medium text-slate-700 truncate">{item.phone}</div>
                                )}
                              </div>
                              
                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded truncate max-w-[120px]">
                                  {item.metaData?.formName || item.source}
                                </div>
                                {item.loanAmount && (
                                  <div className="text-[11px] font-bold text-emerald-600">
                                    ${Number(item.loanAmount).toLocaleString()}
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
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
