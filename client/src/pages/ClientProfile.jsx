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
  ClockIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');
  const [newNote, setNewNote] = useState('');
  const [executions, setExecutions] = useState([]);
  const [reminders, setReminders] = useState([]);

  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };
  
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
      
      const [execRes, remRes] = await Promise.all([
        api.get(`/automations/executions/client/${id}`),
        api.get(`/reminders`)
      ]);
      setExecutions(execRes.data || []);
      
      if (remRes.data && remRes.data.success) {
        const clientReminders = (remRes.data.reminders || []).filter(r => r.client?._id === id || r.client === id);
        setReminders(clientReminders);
      }
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
    <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden">
      {/* Top Navigation / Action Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-30 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/leads')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-[13px] font-medium px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Leads
          </button>
          <div className="hidden sm:block w-[1px] h-6 bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center text-[13px] ring-1 ring-slate-200/50">
              {getInitials(client.fullName)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight leading-none">{client.fullName}</h1>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase tracking-wide">
                  {client.stage.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-slate-500 mt-1">
                <span className="flex items-center gap-1"><EnvelopeIcon className="w-3.5 h-3.5" /> {client.email || 'No email'}</span>
                <span className="flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" /> {client.phone || 'No phone'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/followups?leadId=${id}`)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all"
          >
            <ClockIcon className="w-4 h-4" />
            + Add Follow-up
          </button>

          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-lg text-[13px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
          >
            <PencilSquareIcon className="w-4 h-4 text-slate-400" />
            Edit Profile
          </button>
          
          <button 
            onClick={() => toast.success('Message feature coming soon!')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>

      {/* Main Content Area (70/30 Grid) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Left Column (70%) */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Lead Information Panel */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-6">
              <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest mb-4">Lead Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</span>
                  <span className="text-[14px] font-medium text-slate-900">{client.fullName}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</span>
                  <span className="text-[14px] font-medium text-slate-900">{client.email || '—'}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</span>
                  <span className="text-[14px] font-medium text-slate-900">{client.phone || '—'}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pipeline Stage</span>
                  <span className="text-[14px] font-medium text-slate-900 capitalize">{client.stage.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Lead Value</span>
                  <span className="text-[14px] font-medium text-slate-900">
                    {client.loanAmount ? `$${Number(client.loanAmount).toLocaleString()}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Created Date</span>
                  <span className="text-[14px] font-medium text-slate-900">
                    {client.createdAt ? format(new Date(client.createdAt), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes & Activity Section */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-6 flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Notes & Activity</h2>
              </div>
              
              <form onSubmit={addNote} className="mb-8">
                <div className="relative">
                  <input 
                     type="text"
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-4 pr-24 text-[13px] font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-400 outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                     placeholder="Add a note about this lead..."
                     value={newNote}
                     onChange={e => setNewNote(e.target.value)}
                  />
                  <button type="submit" disabled={!newNote.trim()} className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:hover:bg-slate-200 rounded-md text-[12px] font-bold transition-all">
                    Post
                  </button>
                </div>
              </form>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                 {client.notes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((note, i) => (
                    <div key={i} className="relative flex items-start gap-4 mb-4">
                       <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex flex-shrink-0 items-center justify-center text-[10px] font-bold text-indigo-700 z-10 shadow-sm mt-0.5">
                          {note.createdBy?.name?.charAt(0) || 'A'}
                       </div>
                       <div className="flex-1 bg-white border border-slate-100 rounded-lg p-3.5 shadow-sm">
                          <div className="flex items-center justify-between mb-1.5">
                             <span className="text-[12px] font-bold text-slate-900">{note.createdBy?.name || 'Agent'}</span>
                             <span className="text-[11px] font-medium text-slate-400">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                          </div>
                          <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{note.content}</p>
                       </div>
                    </div>
                 ))}
                 {client.notes.length === 0 && (
                    <div className="text-center py-6 relative z-10">
                      <p className="text-[12px] text-slate-400 font-medium">No activity recorded yet.</p>
                    </div>
                 )}
              </div>
            </div>
            
          </div>
          
          {/* Right Column (30%) */}
          <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
            
            {/* Status & Next Action Summary */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status Overview</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-slate-600">Current Stage</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold capitalize">
                  {client.stage.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-slate-600">Assigned To</span>
                <span className="text-[13px] font-bold text-slate-900">
                  {client.assignedTo?.name || 'Unassigned'}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-slate-600">Next Action</span>
                </div>
                {reminders.filter(r => !r.isCompleted).length > 0 ? (
                  <div className="space-y-2">
                    {reminders.filter(r => !r.isCompleted).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 1).map(r => (
                      <div key={r._id} className="bg-slate-50 p-2 rounded-md border border-slate-200">
                        <p className="text-[13px] font-bold text-slate-900">{r.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{new Date(r.dueDate).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[12px] font-medium text-slate-400 italic">No follow-ups scheduled</span>
                )}
              </div>
              
              <button 
                onClick={() => window.location.href='/followups'}
                className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-lg text-[13px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
              >
                <ClockIcon className="w-4 h-4" />
                Add Follow-up
              </button>
            </div>

            {/* Automation State Widget */}
            {executions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Automations</h3>
                <div className="space-y-4">
                  {executions.map(exec => (
                    <div key={exec._id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-bold text-slate-900">{exec.automation?.name || 'Workflow'}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          exec.status === 'active' ? 'bg-green-100 text-green-700' :
                          exec.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          exec.status === 'stopped' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {exec.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {exec.status === 'active' && exec.nextRunAt ? (
                          <>Next step: {new Date(exec.nextRunAt).toLocaleString()}</>
                        ) : exec.status === 'completed' ? (
                          <>Completed on {new Date(exec.completedAt).toLocaleDateString()}</>
                        ) : exec.status === 'stopped' ? (
                          <>Stopped: {exec.failureReason || 'Manual intervention'}</>
                        ) : (
                          <>Failed: {exec.failureReason}</>
                        )}
                      </div>
                      {exec.status === 'active' && (
                        <div className="mt-2 flex space-x-2">
                          <button 
                            onClick={() => {
                              api.patch(`/automations/executions/${exec._id}/status`, { status: 'paused' }).then(() => fetchClient());
                            }}
                            className="text-[11px] font-medium text-amber-600 hover:underline"
                          >
                            Pause
                          </button>
                          <button 
                            onClick={() => {
                              api.patch(`/automations/executions/${exec._id}/status`, { status: 'stopped' }).then(() => fetchClient());
                            }}
                            className="text-[11px] font-medium text-red-600 hover:underline"
                          >
                            Stop
                          </button>
                        </div>
                      )}
                      {exec.status === 'paused' && (
                        <div className="mt-2 flex space-x-2">
                          <button 
                            onClick={() => {
                              api.patch(`/automations/executions/${exec._id}/status`, { status: 'active' }).then(() => fetchClient());
                            }}
                            className="text-[11px] font-medium text-green-600 hover:underline"
                          >
                            Resume
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta Ads Lead Data */}
            {client.source === 'facebook' && (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Lead Source: Meta Ads</h3>
                </div>
                
                <div className="space-y-3 mb-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Campaign Name</span>
                      <span className="text-[12px] font-medium text-slate-800 break-words">{client.metaData?.campaignName || 'Unknown Campaign'}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Form Name</span>
                      <span className="text-[12px] font-medium text-slate-800 break-words">{client.metaData?.formName || 'Unknown Form'}</span>
                   </div>
                </div>

                {client.metaData?.customFields && Object.keys(client.metaData.customFields).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Form Responses</h4>
                     <div className="space-y-3">
                        {Object.entries(client.metaData.customFields).map(([key, val]) => (
                           <div key={key} className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-medium text-slate-500">{key.replace(/_/g, ' ')}</span>
                              <span className="text-[12px] font-semibold text-slate-800 leading-snug">{val || '—'}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
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

