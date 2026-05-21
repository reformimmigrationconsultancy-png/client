import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  UserCircleIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  DocumentIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');
  const [newNote, setNewNote] = useState('');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [callData, setCallData] = useState({ direction: 'outbound', status: 'answered', duration: 0, notes: '' });

  useEffect(() => {
    fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await api.get(`/clients/${id}`);
      setClient(res.data.client);
      setEditData(res.data.client);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load client profile');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
       const res = await api.post(`/clients/${id}/notes`, { content: newNote });
       setClient({ ...client, notes: res.data.notes });
       setNewNote('');
       toast.success('Note added');
    } catch(err) {
       console.error(err);
       toast.error('Failed to add note');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/clients/${id}`, editData);
      setClient(res.data.client);
      setIsEditModalOpen(false);
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading('Uploading...', { id: 'upload' });
      const res = await api.post(`/clients/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setClient({ ...client, documents: res.data.documents });
      toast.success('File uploaded', { id: 'upload' });
    } catch (err) {
      console.error(err);
      toast.error('Upload failed', { id: 'upload' });
    }
  };

  const handleLogCall = async (e) => {
    e.preventDefault();
    try {
      await api.post('/calls', { ...callData, client: id });
      setIsCallModalOpen(false);
      toast.success('Call logged');
      setCallData({ direction: 'outbound', status: 'answered', duration: 0, notes: '' });
      // Optionally fetch calls if we add a calls sub-tab (we have it ready)
    } catch (err) {
      console.error(err);
      toast.error('Failed to log call');
    }
  };

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading profile...</div>;
  if (!client) return <div className="p-8 text-red-500">Client not found</div>;

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-hidden">
      {/* Header Profile Info */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-6 shadow-sm flex-shrink-0 animate-in fade-in slide-in-from-top duration-300">
         <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start gap-4 md:gap-6">
            <div className="flex flex-col xs:flex-row gap-4 xs:gap-6 items-start xs:items-center">
               <div className="h-16 w-16 sm:h-24 sm:w-24 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-4xl font-extrabold shadow-lg transform -rotate-2 shrink-0">
                  {client.fullName.charAt(0)}
               </div>
               <div className="min-w-0">
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">{client.fullName}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-slate-600">
                     <span className="flex items-center gap-1.5 min-w-0 truncate"><EnvelopeIcon className="w-4 h-4 text-slate-400 shrink-0"/> <span className="truncate">{client.email || 'No email established'}</span></span>
                     <span className="flex items-center gap-1.5 shrink-0"><PhoneIcon className="w-4 h-4 text-slate-400 shrink-0"/> {client.phone || 'No phone established'}</span>
                     <span className="flex items-center gap-1.5 capitalize px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 uppercase tracking-tighter shrink-0">
                        {client.stage.replace('_', ' ')}
                     </span>
                  </div>
               </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
               <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
               >
                  <PencilSquareIcon className="w-4 h-4" /> Edit Profile
               </button>
               <button 
                  onClick={() => navigate('/inbox')}
                  className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-slate-900 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white hover:bg-slate-800 transition-all flex items-center gap-2"
               >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" /> Message
               </button>
            </div>
         </div>
         
         <div className="flex gap-6 sm:gap-8 mt-6 sm:mt-10 border-b border-slate-100">
             {['notes', 'calls', 'documents'].map(tab => (
                 <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-xs font-black transition-all capitalize tracking-widest ${activeTab === tab ? 'border-b-4 border-blue-600 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    {tab}
                 </button>
             ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl w-full mx-auto pb-20">
         {activeTab === 'notes' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Meta Ads Lead Capture Card */}
                {client.source === 'facebook' && client.metaData && (client.metaData.campaignName || client.metaData.formName || (client.metaData.customFields && Object.keys(client.metaData.customFields).length > 0)) && (
                   <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 rounded-2xl border border-blue-100/70 p-6 shadow-sm animate-in zoom-in duration-300 relative overflow-hidden">
                      {/* Premium decorative accent */}
                      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-indigo-500/0 rounded-bl-full pointer-events-none"></div>
                      
                      <div className="flex items-center gap-3 border-b border-blue-100/50 pb-4 mb-4">
                         <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                         </div>
                         <div>
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Meta Ads Lead Capture</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sourced from Facebook Lead Ads</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign context</h4>
                            <div className="space-y-2.5">
                               <div className="flex justify-between items-center text-sm font-medium">
                                  <span className="text-slate-500 text-xs">Campaign:</span>
                                  <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm text-xs truncate max-w-[200px]">{client.metaData.campaignName || 'N/A'}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm font-medium">
                                  <span className="text-slate-500 text-xs">Ad Name:</span>
                                  <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm text-xs truncate max-w-[200px]">{client.metaData.adName || 'N/A'}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm font-medium">
                                  <span className="text-slate-500 text-xs">Form Name:</span>
                                  <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm text-xs truncate max-w-[200px]">{client.metaData.formName || 'N/A'}</span>
                               </div>
                            </div>
                         </div>
                         
                         {client.metaData.customFields && Object.keys(client.metaData.customFields).length > 0 && (
                            <div className="space-y-3">
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Form Questionnaire Responses</h4>
                               <div className="space-y-2.5 bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-blue-100/50 shadow-sm max-h-[160px] overflow-y-auto custom-scrollbar">
                                  {Object.entries(client.metaData.customFields).map(([key, val]) => (
                                     <div key={key} className="flex flex-col gap-0.5 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0 last:mb-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-xs font-bold text-slate-700 leading-tight">{val || 'No answer'}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                )}

                <form onSubmit={addNote} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-600 transition-all">
                    <textarea 
                       className="w-full resize-none border-0 p-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6 font-medium"
                       rows={4}
                       placeholder="Write a private note about this client..."
                       value={newNote}
                       onChange={e => setNewNote(e.target.value)}
                    />
                    <div className="mt-3 flex justify-end">
                       <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-500 shadow-sm transition-all hover:-translate-y-0.5">Save Note</button>
                    </div>
                </form>

                <div className="space-y-4">
                   {client.notes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((note, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                         <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-black text-slate-700">
                                   {note.createdBy?.name?.charAt(0) || 'A'}
                                </div>
                                <span className="text-sm font-bold text-slate-900">{note.createdBy?.name || 'Agent'}</span>
                             </div>
                             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{format(new Date(note.createdAt), 'MMM d • h:mm a')}</span>
                         </div>
                         <p className="text-sm text-slate-700 leading-relaxed font-medium">{note.content}</p>
                      </div>
                   ))}
                   {client.notes.length === 0 && <p className="text-center text-slate-400 font-bold py-10 uppercase text-xs tracking-widest">No history recorded yet</p>}
                </div>
            </div>
         )}
         
         {activeTab === 'documents' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 text-center relative overflow-hidden group">
                     {/* Decorative circle */}
                     <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-all duration-500"></div>
                     
                     <DocumentIcon className="w-16 h-16 text-blue-100 mx-auto mb-4 group-hover:text-blue-200 transition-colors" />
                     <h3 className="text-xl font-black text-slate-900">Vault & Documentation</h3>
                     <p className="text-sm text-slate-500 mt-2 mb-8 max-w-sm mx-auto font-medium">Securely store and manage sensitive documents, ID proofing, and financial statements.</p>
                     
                     <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg transition-all hover:-translate-y-1 active:translate-y-0">
                        <ArrowUpTrayIcon className="w-4 h-4" />
                        Upload Selection
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                     </label>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {client.documents?.map((doc, i) => (
                       <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-blue-400 transition-all cursor-pointer">
                          <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                             <DocumentIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold text-slate-900 truncate">{doc.originalName}</p>
                             <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{(doc.size / 1024).toFixed(1)} KB • {doc.mimetype.split('/')[1]}</p>
                          </div>
                       </div>
                    ))}
                 </div>
             </div>
         )}

         {activeTab === 'calls' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 text-center relative overflow-hidden group">
                     {/* Decorative circle */}
                     <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-emerald-50 rounded-full opacity-50 group-hover:scale-125 transition-all duration-500"></div>
                     
                     <PhoneIcon className="w-16 h-16 text-emerald-100 mx-auto mb-4 group-hover:text-emerald-200 transition-colors" />
                     <h3 className="text-xl font-black text-slate-900">Communication Logs</h3>
                     <p className="text-sm text-slate-500 mt-2 mb-8 max-w-sm mx-auto font-medium">Review interaction history and record manual client touchpoints.</p>
                     
                     <button 
                        onClick={() => setIsCallModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-white border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                     >
                        <ClockIcon className="w-4 h-4" />
                        Log Manual Interaction
                     </button>
                 </div>
                 
                 <div className="text-center py-10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Interaction history is strictly auditable</p>
                 </div>
             </div>
         )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Refine Information</h3>
                 <button onClick={() => setIsEditModalOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-slate-600" />
                 </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-8 space-y-5">
                 <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Client Full Name</label>
                       <input 
                          required
                          type="text"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                          value={editData.fullName}
                          onChange={e => setEditData({...editData, fullName: e.target.value})}
                       />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Terminal</label>
                      <input 
                          type="email"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                          value={editData.email}
                          onChange={e => setEditData({...editData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Direct Dial</label>
                      <input 
                          type="text"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                          value={editData.phone}
                          onChange={e => setEditData({...editData, phone: e.target.value})}
                      />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Pipeline Position</label>
                    <select 
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                       value={editData.stage}
                       onChange={e => setEditData({...editData, stage: e.target.value})}
                    >
                       <option value="new_lead">New Opportunity</option>
                       <option value="contacted">Contact Established</option>
                       <option value="interested">High Interest</option>
                       <option value="documents_received">Verification Underway</option>
                       <option value="approved">Final Approval</option>
                       <option value="closed">Cycle Closed</option>
                    </select>
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button 
                       type="button"
                       onClick={() => setIsEditModalOpen(false)}
                       className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                    >
                       Discard
                    </button>
                    <button 
                       type="submit"
                       className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-500 shadow-xl shadow-blue-200 transition-all"
                    >
                       Apply Changes
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Log Call Modal */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                 <h3 className="text-xl font-black text-emerald-900 tracking-tight">Manual Interaction</h3>
                 <button onClick={() => setIsCallModalOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-emerald-100 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-emerald-700" />
                 </button>
              </div>
              
              <form onSubmit={handleLogCall} className="p-8 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                       <select 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                          value={callData.direction}
                          onChange={e => setCallData({...callData, direction: e.target.value})}
                       >
                          <option value="outbound">Outbound</option>
                          <option value="inbound">Inbound</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Outcome</label>
                       <select 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                          value={callData.status}
                          onChange={e => setCallData({...callData, status: e.target.value})}
                       >
                          <option value="answered">Answered</option>
                          <option value="missed">Missed</option>
                          <option value="busy">Busy / Reject</option>
                       </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Interaction Minutes</label>
                    <input 
                       type="number"
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none"
                       placeholder="Duration (sec)"
                       value={callData.duration}
                       onChange={e => setCallData({...callData, duration: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Call Highlights</label>
                    <textarea 
                       className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3 text-sm font-bold outline-none resize-none"
                       rows={3}
                       placeholder="What was discussed?"
                       value={callData.notes}
                       onChange={e => setCallData({...callData, notes: e.target.value})}
                    />
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                       type="submit"
                       className="w-full px-6 py-4 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-500 shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                    >
                       <CheckCircleIcon className="w-5 h-5" /> Confirm Record
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

