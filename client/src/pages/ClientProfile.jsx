import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  BriefcaseIcon,
  TrashIcon,
  LinkIcon,
  GlobeAmericasIcon,
  AcademicCapIcon,
  DocumentArrowUpIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');
  const [newNote, setNewNote] = useState('');
  const [executions, setExecutions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    api.get('/auth/team-members')
      .then(res => {
        if (res.data?.success) {
          setTeamMembers(res.data.users || []);
        }
      })
      .catch(err => console.error('Failed to load team members:', err));
  }, []);

  const handleAssignChange = async (userId) => {
    setIsAssigning(true);
    try {
      const res = await api.put(`/clients/${id}`, { assignedTo: userId || null });
      if (res.data?.success) {
        setClient(prev => ({ ...prev, assignedTo: res.data.client.assignedTo }));
        const assignedUser = teamMembers.find(m => String(m._id) === String(userId));
        toast.success(assignedUser ? `Assigned to ${assignedUser.name}` : 'Lead unassigned');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update lead assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return 'L';
  };
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [callData, setCallData] = useState({ direction: 'outbound', status: 'answered', duration: 0, notes: '' });

  // Follow-up Card State & Ref
  const followUpCardRef = useRef(null);

  const getDefaultFollowUpDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [followUpDate, setFollowUpDate] = useState(getDefaultFollowUpDate());
  const [followUpTitle, setFollowUpTitle] = useState('Follow-up Call');
  const [customTitle, setCustomTitle] = useState('');
  const [followUpType, setFollowUpType] = useState('call');
  const [followUpPriority, setFollowUpPriority] = useState('medium');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  const setQuickDate = (daysAhead, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setFollowUpDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleCreateFollowUp = async (e) => {
    if (e) e.preventDefault();
    if (!followUpDate) {
      toast.error('Please select a follow-up date and time');
      return;
    }

    const titleToUse = followUpTitle === 'Custom' ? customTitle.trim() : followUpTitle;
    if (!titleToUse) {
      toast.error('Please enter a follow-up title');
      return;
    }

    setSubmittingFollowUp(true);
    const tId = toast.loading('Scheduling follow-up...');
    try {
      const res = await api.post('/reminders', {
        client: id,
        title: titleToUse,
        dueDate: new Date(followUpDate).toISOString(),
        type: followUpType,
        priority: followUpPriority,
        notes: followUpNotes.trim() || undefined
      });

      if (res.data && res.data.success) {
        toast.success(`Follow-up scheduled for ${format(new Date(followUpDate), 'MMM d, h:mm a')}`, { id: tId });
        setFollowUpNotes('');
        if (followUpTitle === 'Custom') setCustomTitle('');
        // Refresh reminders
        const remRes = await api.get(`/reminders`);
        if (remRes.data && remRes.data.success) {
          const clientReminders = (remRes.data.reminders || []).filter(r => r.client?._id === id || r.client === id);
          setReminders(clientReminders);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule follow-up', { id: tId });
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleCompleteFollowUp = async (reminderId) => {
    try {
      await api.post(`/reminders/${reminderId}/complete`);
      toast.success('Follow-up marked as completed!');
      setReminders(prev => prev.map(r => r._id === reminderId ? { ...r, isCompleted: true, status: 'completed' } : r));
    } catch (err) {
      toast.error('Failed to complete follow-up');
    }
  };

  const handleDeleteFollowUp = async (reminderId) => {
    try {
      await api.delete(`/reminders/${reminderId}`);
      toast.success('Follow-up deleted');
      setReminders(prev => prev.filter(r => r._id !== reminderId));
    } catch (err) {
      toast.error('Failed to delete follow-up');
    }
  };

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

  const handleDeleteClient = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete lead '${client.fullName}'?`)) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success(`Lead '${client.fullName}' deleted`);
      navigate('/leads');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  const getPortalLink = async () => {
    if (client.portalToken) {
      return `${window.location.origin}/portal/${client.portalToken}`;
    }
    try {
      const res = await api.get(`/portal/client/${id}/link`);
      if (res.data.success && res.data.portalToken) {
        setClient(prev => ({ ...prev, portalToken: res.data.portalToken }));
        return `${window.location.origin}/portal/${res.data.portalToken}`;
      }
    } catch (e) {}
    return `${window.location.origin}/portal/${client._id}`;
  };

  const handleCopyPortalLink = async () => {
    const link = await getPortalLink();
    navigator.clipboard.writeText(link);
    toast.success('📋 Secure Client Intake link copied to clipboard!');
  };

  const handleSendWhatsApp = async () => {
    const link = await getPortalLink();
    const cleanPhone = (client.phone || '').replace(/[^0-9]/g, '');
    const message = `Hello ${client.fullName},\n\nPlease complete your Visa Assessment & Document submission using this secure link:\n${link}\n\nThank you,\nManinder Pal Singh Immigration Services`;
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
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

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleCopyPortalLink}
            title="Copy client's unique intake portal link"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[13px] font-bold shadow-2xs transition-all"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Copy Intake Link</span>
          </button>

          <button 
            onClick={handleSendWhatsApp}
            title="Send portal link directly to client on WhatsApp"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[13px] font-bold shadow-2xs transition-all"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

          <button 
            onClick={() => {
              if (followUpCardRef.current) {
                followUpCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const dateInput = followUpCardRef.current.querySelector('input[type="datetime-local"]');
                if (dateInput) {
                  setTimeout(() => dateInput.focus(), 200);
                }
              }
            }}
            title="Set follow-up date for this client"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-[13px] shadow-2xs transition-all"
          >
            <ClockIcon className="w-4 h-4" />
            + Follow-up
          </button>

          {(user?.role === 'admin' || user?.permissions?.editLeads) && (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-lg text-[13px] font-semibold shadow-2xs transition-all"
            >
              <PencilSquareIcon className="w-4 h-4 text-slate-400" />
              Edit
            </button>
          )}

          {(user?.role === 'admin' || user?.permissions?.deleteLeads) && (
            <button 
              onClick={handleDeleteClient}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-[13px] font-semibold transition-all"
              title="Delete Lead"
            >
              <TrashIcon className="w-4 h-4 text-rose-500" />
            </button>
          )}
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

            {/* Visa & Intake Assessment Details Panel */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <GlobeAmericasIcon className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">
                    Visa Application & Intake Details
                  </h2>
                </div>

                {client.portalStatus === 'submitted' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Submitted via Portal {client.portalSubmittedAt ? `(${format(new Date(client.portalSubmittedAt), 'MMM d, h:mm a')})` : ''}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Intake Pending
                    </span>
                    <button
                      onClick={handleCopyPortalLink}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Country</span>
                  <span className="text-[14px] font-bold text-slate-900">
                    {client.visaDetails?.targetCountry || 'Not selected'}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Visa Category</span>
                  <span className="text-[14px] font-bold text-indigo-600">
                    {client.visaDetails?.visaType || 'Study / General Visa'}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Passport Number</span>
                  <span className="text-[14px] font-medium text-slate-900">
                    {client.visaDetails?.passportNumber ? (
                      <span className="font-mono uppercase font-bold">{client.visaDetails.passportNumber} {client.visaDetails.passportExpiry ? `(Exp: ${client.visaDetails.passportExpiry})` : ''}</span>
                    ) : 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Highest Qualification</span>
                  <span className="text-[13px] font-medium text-slate-800">
                    {client.visaDetails?.highestEducation || '—'} {client.visaDetails?.fieldOfStudy ? `in ${client.visaDetails.fieldOfStudy}` : ''}
                    {client.visaDetails?.percentageOrCgpa ? ` (${client.visaDetails.percentageOrCgpa})` : ''}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">English Language Test</span>
                  <span className="text-[13px] font-bold text-emerald-700">
                    {client.visaDetails?.englishTest || '—'} {client.visaDetails?.overallScore ? `• ${client.visaDetails.overallScore}` : ''}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Work Experience</span>
                  <span className="text-[13px] font-medium text-slate-800">
                    {client.visaDetails?.workExperienceYears ? `${client.visaDetails.workExperienceYears} Years` : '0 Years'} {client.visaDetails?.currentJobTitle ? `(${client.visaDetails.currentJobTitle})` : ''}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Location / Address</span>
                  <span className="text-[13px] font-medium text-slate-800">
                    {[client.city, client.state, client.country].filter(Boolean).join(', ') || client.address || '—'}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Visa Refusal History</span>
                  <span className={`text-[13px] font-bold ${client.visaDetails?.hasVisaRefusal === 'Yes' ? 'text-rose-600' : 'text-slate-700'}`}>
                    {client.visaDetails?.hasVisaRefusal === 'Yes' ? `⚠️ Yes (${client.visaDetails?.refusalDetails || 'Refusal noted'})` : 'None / Fresh Applicant'}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Client Comments / Note</span>
                  <span className="text-[13px] text-slate-600 italic">
                    {client.visaDetails?.comments || 'No special requests'}
                  </span>
                </div>
              </div>

              {/* Uploaded Documents List */}
              {client.documents && client.documents.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Attached Documents ({client.documents.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {client.documents.map((doc, dIdx) => (
                      <a
                        key={dIdx}
                        href={`${BACKEND_URL}/uploads/documents/${client._id}/${doc.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs transition-all group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <DocumentIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                            {doc.originalName || doc.filename}
                          </span>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-bold shrink-0 ml-1">View ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
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
            
            {/* Follow-up & Reminder Card */}
            <div ref={followUpCardRef} className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <ClockIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider">Follow-up Date</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Set next follow-up action</p>
                  </div>
                </div>
                {reminders.filter(r => !r.isCompleted).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {reminders.filter(r => !r.isCompleted).length} Scheduled
                  </span>
                )}
              </div>

              {/* Add Follow-up Form */}
              <form onSubmit={handleCreateFollowUp} className="space-y-3">
                {/* Date & Time Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Select Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    required
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                {/* Quick Date Shortcuts */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setQuickDate(1, 10)}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors"
                  >
                    Tomorrow 10 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(2, 11)}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors"
                  >
                    In 2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7, 10)}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors"
                  >
                    In 1 Week
                  </button>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Follow-up Type
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'call', label: 'Call', icon: PhoneIcon },
                      { id: 'whatsapp', label: 'Chat', icon: ChatBubbleLeftRightIcon },
                      { id: 'email', label: 'Email', icon: EnvelopeIcon },
                      { id: 'meeting', label: 'Meet', icon: UserCircleIcon }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFollowUpType(t.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                          followUpType === t.id
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        <t.icon className="w-3 h-3" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Follow-up Reason / Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Reason / Purpose
                  </label>
                  <select
                    value={followUpTitle}
                    onChange={(e) => setFollowUpTitle(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all mb-1.5"
                  >
                    <option value="Follow-up Call">Follow-up Call</option>
                    <option value="Visa Application Discussion">Visa Application Discussion</option>
                    <option value="Document Collection">Document Collection</option>
                    <option value="IELTS / PTE Test Score Follow-up">IELTS / PTE Test Score Follow-up</option>
                    <option value="Fee Payment & Agreement">Fee Payment &amp; Agreement</option>
                    <option value="Custom">Custom Note...</option>
                  </select>
                  {followUpTitle === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Type custom follow-up title..."
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      required
                      className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  )}
                </div>

                {/* Optional Note */}
                <div>
                  <input
                    type="text"
                    placeholder="Optional note / reminder details..."
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingFollowUp || !followUpDate}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <ClockIcon className="w-3.5 h-3.5" />
                  {submittingFollowUp ? 'Scheduling...' : 'Set Follow-up Date'}
                </button>
              </form>

              {/* Scheduled Follow-ups List */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                  Scheduled Follow-ups ({reminders.filter(r => !r.isCompleted).length})
                </span>

                {reminders.filter(r => !r.isCompleted).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                    No follow-ups scheduled yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {reminders.filter(r => !r.isCompleted).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).map((rem) => {
                      const dueDate = new Date(rem.dueDate);
                      const isOverdue = dueDate < new Date();
                      return (
                        <div
                          key={rem._id}
                          className={`p-2.5 rounded-lg border text-xs transition-all ${
                            isOverdue
                              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold truncate">{rem.title}</span>
                                {isOverdue && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-200/80 text-rose-800 uppercase">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 shrink-0 text-slate-400" />
                                {format(dueDate, 'MMM d, yyyy · h:mm a')}
                              </p>
                              {rem.notes && (
                                <p className="text-[10px] text-slate-500 mt-1 italic line-clamp-2">
                                  {rem.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCompleteFollowUp(rem._id)}
                                title="Mark Completed"
                                className="p-1 rounded hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFollowUp(rem._id)}
                                title="Delete Follow-up"
                                className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Status Overview Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-5">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status Overview</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-slate-600">Current Stage</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold capitalize">
                  {client.stage.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-slate-600">Assigned To</span>
                {user?.role === 'admin' || user?.permissions?.editLeads ? (
                  <div className="relative">
                    <select
                      value={client.assignedTo?._id || client.assignedTo || ''}
                      onChange={(e) => handleAssignChange(e.target.value)}
                      disabled={isAssigning}
                      className="text-[12.5px] font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} {m.role === 'admin' ? '(Admin)' : '(Staff)'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-[13px] font-bold text-slate-900">
                    {client.assignedTo?.name || 'Unassigned'}
                  </span>
                )}
              </div>
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

