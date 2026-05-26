import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  EnvelopeIcon, PlusIcon, InboxIcon, StarIcon, 
  ClockIcon, PaperAirplaneIcon, DocumentIcon, 
  TagIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon,
  ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon,
  EllipsisVerticalIcon, XMarkIcon, ChevronDownIcon,
  PaperClipIcon, PhotoIcon, LinkIcon, FaceSmileIcon, TrashIcon, Bars3Icon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { format, isToday, isThisYear } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function Emails() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [emailSidebarOpen, setEmailSidebarOpen] = useState(false);
  const [allEmails, setAllEmails] = useState({ inbox: [], sent: [] });
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // Compose state
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    fetchEmails();
    fetchTemplates();

    const io = api.getSocket?.(); // If your api provides a socket instance, or we can just let polling or manual refresh handle it.
    // Actually, Layout.jsx usually handles socket, so we can listen there, or just rely on the manual refresh button for now to keep it exactly like Gmail.
  }, [activeTab]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/emails/all');
      const allMsgs = res.data.messages || [];
      
      const inbox = allMsgs.filter(m => m.sender === 'client');
      const sent = allMsgs.filter(m => m.sender === 'agent');
      
      setAllEmails({ inbox, sent });
      
      if (activeTab === 'inbox') setEmails(inbox);
      else if (activeTab === 'sent') setEmails(sent);
      else setEmails([]);
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    try {
      setLoading(true);
      toast('Syncing with Gmail...', { icon: '🔄' });
      const res = await api.get('/emails/sync');
      const allMsgs = res.data.messages || [];
      
      const inbox = allMsgs.filter(m => m.sender === 'client');
      const sent = allMsgs.filter(m => m.sender === 'agent');
      
      setAllEmails({ inbox, sent });
      
      if (activeTab === 'inbox') setEmails(inbox);
      else if (activeTab === 'sent') setEmails(sent);
      else setEmails([]);
      
      toast.success('Inbox updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') setEmails(allEmails.inbox);
    else if (activeTab === 'sent') setEmails(allEmails.sent);
    else setEmails([]);
  }, [activeTab, allEmails]);

  const handleEmailClick = async (msg) => {
    setSelectedEmail(msg);
    if (!msg.read && activeTab === 'inbox') {
      try {
        await api.put(`/emails/read/${msg._id}`);
        // Update locally
        const updateMsgs = (list) => list.map(m => m._id === msg._id ? { ...m, read: true } : m);
        setAllEmails(prev => ({ ...prev, inbox: updateMsgs(prev.inbox) }));
        setEmails(prev => updateMsgs(prev));
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/emails/templates');
      setTemplates(res.data.templates);
    } catch (err) {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
       await api.post('/emails/send', { ...emailData, templateKey: selectedTemplate });
       toast.success('Email sent');
       setComposeOpen(false);
       setEmailData({ to: '', subject: '', body: '' });
       setSelectedTemplate('');
       if (activeTab === 'sent') fetchEmails();
    } catch (err) {
       toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
       setSending(false);
    }
  };

  const handleReply = () => {
     if (!selectedEmail) return;
     const senderEmail = selectedEmail.conversationId?.client?.email || '';
     const subjectMatch = selectedEmail.content.match(/^\[SUBJECT: (.*?)\]/);
     const originalSubject = subjectMatch ? subjectMatch[1] : 'No Subject';
     const subject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
     
     const originalBody = selectedEmail.content.replace(/^\[SUBJECT: .*?\]\n\n/, '');
     const dateStr = formatEmailDate(selectedEmail.createdAt);
     const senderName = selectedEmail.conversationId?.client?.fullName || 'Unknown';
     
     const body = `\n\nOn ${dateStr}, ${senderName} <${senderEmail}> wrote:\n> ${originalBody.replace(/\n/g, '\n> ')}`;
     
     setEmailData({ to: senderEmail, subject, body });
     setComposeOpen(true);
  };

  const handleForward = () => {
     if (!selectedEmail) return;
     const senderEmail = selectedEmail.conversationId?.client?.email || '';
     const subjectMatch = selectedEmail.content.match(/^\[SUBJECT: (.*?)\]/);
     const originalSubject = subjectMatch ? subjectMatch[1] : 'No Subject';
     const subject = originalSubject.startsWith('Fwd:') ? originalSubject : `Fwd: ${originalSubject}`;
     
     const originalBody = selectedEmail.content.replace(/^\[SUBJECT: .*?\]\n\n/, '');
     const dateStr = formatEmailDate(selectedEmail.createdAt);
     const senderName = selectedEmail.conversationId?.client?.fullName || 'Unknown';
     
     const body = `\n\n---------- Forwarded message ---------\nFrom: ${senderName} <${senderEmail}>\nDate: ${dateStr}\nSubject: ${originalSubject}\nTo: Me\n\n${originalBody}`;
     
     setEmailData({ to: '', subject, body });
     setComposeOpen(true);
  };

  const handleDeleteEmail = async (msg, e) => {
     if (e) e.stopPropagation();
     if (!window.confirm('Are you sure you want to delete this email?')) return;
     
     try {
       await api.delete(`/emails/${msg._id}`);
       toast.success('Email deleted');
       if (selectedEmail?._id === msg._id) setSelectedEmail(null);
       
       const removeMsg = (list) => list.filter(m => m._id !== msg._id);
       setAllEmails(prev => ({ inbox: removeMsg(prev.inbox), sent: removeMsg(prev.sent) }));
       setEmails(prev => removeMsg(prev));
     } catch (err) {
       console.error('Failed to delete email', err);
       toast.error('Failed to delete email');
     }
  };

  const formatEmailDate = (dateString) => {
    const d = new Date(dateString);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isThisYear(d)) return format(d, 'MMM d');
    return format(d, 'MM/dd/yyyy');
  };

  const unreadCount = allEmails.inbox.filter(m => !m.read).length;

  const SIDEBAR_ITEMS = [
    { id: 'inbox', name: 'Inbox', icon: InboxIcon, count: unreadCount },
    { id: 'starred', name: 'Starred', icon: StarIcon },
    { id: 'snoozed', name: 'Snoozed', icon: ClockIcon },
    { id: 'sent', name: 'Sent', icon: PaperAirplaneIcon, count: allEmails.sent.length },
    { id: 'drafts', name: 'Drafts', icon: DocumentIcon },
    { id: 'more', name: 'More', icon: ChevronDownIcon },
  ];

  const SidebarContent = () => (
    <>
      <div className="pt-2 pb-4 pl-2 hidden md:block">
         <button 
            onClick={() => { setComposeOpen(true); setEmailSidebarOpen(false); }}
            className="flex items-center gap-4 bg-[#c2e7ff] hover:bg-[#b3dcf5] text-[#001d35] px-5 py-4 rounded-2xl font-medium shadow-sm transition-all shadow-[#c2e7ff]/50"
         >
            <PlusIcon className="w-6 h-6" />
            <span className="text-[14px]">Compose</span>
         </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5 pr-2">
         {SIDEBAR_ITEMS.map(item => (
            <button 
               key={item.id}
               onClick={() => { setActiveTab(item.id); setEmailSidebarOpen(false); }}
               className={`w-full flex items-center justify-between px-6 py-1.5 rounded-r-full transition-colors ${activeTab === item.id ? 'bg-[#d3e3fd] text-[#041e49] font-bold' : 'text-[#444746] hover:bg-black/5 font-medium'}`}
            >
               <div className="flex items-center gap-4">
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#0b57d0]' : 'text-[#444746]'}`} />
                  <span className="text-sm">{item.name}</span>
               </div>
               {item.count > 0 && <span className="text-xs">{item.count}</span>}
            </button>
         ))}
         
         <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="px-6 text-xs font-semibold text-[#444746] mb-2 flex justify-between items-center group cursor-pointer">
               Labels <PlusIcon className="w-4 h-4 opacity-0 group-hover:opacity-100" />
            </h3>
            <button className="w-full flex items-center gap-4 px-6 py-1.5 rounded-r-full text-[#444746] hover:bg-black/5 font-medium">
               <TagIcon className="w-5 h-5" />
               <span className="text-sm">Notes</span>
            </button>
         </div>
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full bg-[#f6f8fc] overflow-hidden text-[14px] relative">
      
      {/* Desktop Sidebar */}
      <div className="w-[256px] hidden md:flex flex-col shrink-0 px-3 py-2">
         <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {emailSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[80] flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setEmailSidebarOpen(false)} />
          <div className="relative flex flex-col w-[260px] h-full bg-[#f6f8fc] p-3 shadow-2xl animate-in slide-in-from-left duration-300">
             <div className="flex items-center justify-between mb-4 pl-4 pt-2">
                <span className="text-lg font-bold text-gray-800">Mail Menu</span>
                <button onClick={() => setEmailSidebarOpen(false)} className="p-2 rounded-full hover:bg-black/5 text-gray-600">
                   <XMarkIcon className="w-6 h-6" />
                </button>
             </div>
             <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-white md:rounded-2xl md:my-2 md:mr-2 shadow-sm overflow-hidden border border-gray-100 relative">
         
         {/* Top Actions Bar */}
         <div className="h-[56px] md:h-[48px] flex items-center justify-between px-2 md:px-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-1 md:gap-4">
               <button className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors" onClick={() => setEmailSidebarOpen(true)}>
                  <Bars3Icon className="w-6 h-6" />
               </button>
               <div className="hidden md:flex items-center gap-1 ml-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0b57d0] focus:ring-[#0b57d0]" />
                  <ChevronDownIcon className="w-3 h-3 text-gray-500 cursor-pointer" />
               </div>
               <button onClick={syncEmails} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                  <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
               </button>
               <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                  <EllipsisVerticalIcon className="w-5 h-5" />
               </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
               <span>{emails.length > 0 ? `1-${emails.length} of ${emails.length}` : ''}</span>
               <div className="flex gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><ChevronLeftIcon className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
               </div>
            </div>
         </div>

         {/* Tabs - Only Primary */}
         {!selectedEmail && (
            <div className="flex border-b border-gray-100 px-4 shrink-0">
               <button className="flex items-center gap-4 px-4 py-3 border-b-4 border-[#0b57d0] text-[#0b57d0] font-semibold">
                  <InboxIcon className="w-5 h-5" /> Primary
               </button>
            </div>
         )}

         {/* Email List or View */}
         <div className="flex-1 overflow-y-auto no-scrollbar">
            {selectedEmail ? (
               <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                     <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     </button>
                     <div className="flex gap-3 text-gray-600">
                        <button className="p-2 hover:bg-gray-100 rounded-full"><DocumentIcon className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteEmail(selectedEmail)} className="p-2 hover:bg-gray-100 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                        <button className="p-2 hover:bg-gray-100 rounded-full"><EnvelopeIcon className="w-5 h-5" /></button>
                     </div>
                  </div>

                  <h2 className="text-2xl font-normal text-[#1f1f1f] mb-6 flex items-center gap-3">
                     {selectedEmail.content.match(/^\[SUBJECT: (.*?)\]/) ? selectedEmail.content.match(/^\[SUBJECT: (.*?)\]/)[1] : 'No Subject'}
                     <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">Inbox</span>
                  </h2>

                  <div className="flex items-start justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                           {(selectedEmail.conversationId?.client?.fullName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1f1f1f]">{selectedEmail.conversationId?.client?.fullName || 'Unknown'}</span>
                              <span className="text-xs text-gray-500">&lt;{selectedEmail.conversationId?.client?.email || ''}&gt;</span>
                           </div>
                           <div className="text-xs text-gray-500">to me <ChevronDownIcon className="w-3 h-3 inline" /></div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 text-gray-500 text-sm">
                        <span>{formatEmailDate(selectedEmail.createdAt)}</span>
                        <button className="p-1.5 hover:bg-gray-100 rounded-full"><StarIcon className="w-5 h-5" /></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-full"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-full"><EllipsisVerticalIcon className="w-5 h-5" /></button>
                     </div>
                  </div>

                  <div className="text-[#1f1f1f] whitespace-pre-wrap pl-14 text-sm font-normal">
                     {selectedEmail.content.replace(/^\[SUBJECT: .*?\]\n\n/, '')}
                  </div>

                  <div className="pl-14 mt-8 flex gap-3">
                     <button onClick={handleReply} className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
                        Reply
                     </button>
                     <button onClick={handleForward} className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z"/></svg>
                        Forward
                     </button>
                  </div>
               </div>
            ) : loading ? (
               <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div></div>
            ) : emails.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <InboxIcon className="w-16 h-16 text-gray-300 mb-4" />
                  <p>Your {activeTab} is empty.</p>
               </div>
            ) : (
               <div className="divide-y divide-gray-100 border-b border-gray-100">
                  {emails.map((msg, i) => {
                     const isUnread = !msg.read && activeTab === 'inbox';
                     const subjectMatch = msg.content.match(/^\[SUBJECT: (.*?)\]/);
                     const subject = subjectMatch ? subjectMatch[1] : 'No Subject';
                     const bodySnippet = msg.content.replace(/^\[SUBJECT: .*?\]\n\n/, '').substring(0, 100);
                     const senderOrRecipient = msg.conversationId?.client?.fullName || 'Unknown';

                     return (
                        <div key={i} onClick={() => handleEmailClick(msg)} className={`flex items-center px-4 py-2 hover:shadow-md hover:z-10 relative cursor-pointer group ${isUnread ? 'bg-white' : 'bg-[#f2f6fc]'}`}>
                           <div className="flex items-center gap-3 w-16 shrink-0">
                              <button className="text-gray-300 hover:text-gray-500 transition-colors p-1.5 opacity-40 group-hover:opacity-100">
                                 <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"></path></svg>
                              </button>
                              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0b57d0] focus:ring-[#0b57d0] opacity-40 group-hover:opacity-100" />
                              <button className="text-gray-300 hover:text-gray-400"><StarIcon className="w-5 h-5" /></button>
                           </div>
                           
                           <div className={`w-40 sm:w-48 truncate shrink-0 pr-2 ${isUnread ? 'font-bold text-[#202124]' : 'font-normal text-[#202124]'}`}>
                              {activeTab === 'sent' ? `To: ${senderOrRecipient}` : senderOrRecipient}
                           </div>
                           
                           <div className="flex-1 truncate pr-4 text-[14px]">
                              <span className={`${isUnread ? 'font-bold text-[#202124]' : 'font-normal text-[#202124]'}`}>{subject}</span>
                              <span className="text-[#5f6368] mx-1">-</span>
                              <span className="text-[#5f6368]">{bodySnippet}</span>
                           </div>
                           
                           <div className="w-20 text-right shrink-0 text-[12px] font-medium text-[#5f6368] group-hover:hidden">
                              {formatEmailDate(msg.createdAt)}
                           </div>

                           <div className="w-20 hidden group-hover:flex items-center justify-end gap-2 text-gray-500 shrink-0">
                              <button className="p-1.5 hover:bg-gray-100 rounded-full"><DocumentIcon className="w-4 h-4" /></button>
                              <button onClick={(e) => handleDeleteEmail(msg, e)} className="p-1.5 hover:bg-gray-100 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                              <button className="p-1.5 hover:bg-gray-100 rounded-full"><EnvelopeIcon className="w-4 h-4" /></button>
                              <button className="p-1.5 hover:bg-gray-100 rounded-full"><ClockIcon className="w-4 h-4" /></button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </div>
      </div>

      {/* Mobile Compose FAB */}
      <button 
         onClick={() => setComposeOpen(true)}
         className="md:hidden fixed bottom-6 right-6 w-[60px] h-[60px] bg-[#c2e7ff] text-[#001d35] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl z-[70] transition-all"
      >
         <PlusIcon className="w-7 h-7" />
      </button>

      {/* Compose Modal */}
      {composeOpen && (
         <div className="fixed bottom-0 right-0 md:right-20 w-full md:w-[500px] h-[90vh] md:h-auto bg-white md:rounded-t-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] border-t border-x border-gray-200 z-[90] flex flex-col animate-in slide-in-from-bottom-10 duration-200">
            {/* Header */}
            <div className="bg-[#f2f6fc] px-4 py-2.5 rounded-t-xl flex justify-between items-center cursor-pointer">
               <h3 className="text-sm font-medium text-[#041e49]">New Message</h3>
               <div className="flex gap-2">
                  <button className="p-1 hover:bg-gray-200 rounded text-gray-600"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg></button>
                  <button className="p-1 hover:bg-gray-200 rounded text-gray-600"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 19H5V5h14v14zM21 3H3v18h18V3z"/></svg></button>
                  <button onClick={() => setComposeOpen(false)} className="p-1 hover:bg-gray-200 rounded text-gray-600"><XMarkIcon className="w-4 h-4" /></button>
               </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSend} className="flex flex-col">
               <div className="px-4 py-2 border-b border-gray-100 flex items-center">
                  <span className="text-gray-500 w-12">To</span>
                  <input 
                     type="email" 
                     className="flex-1 outline-none text-[14px]" 
                     value={emailData.to}
                     onChange={e => setEmailData({...emailData, to: e.target.value})}
                     required
                  />
                  <div className="text-gray-500 flex gap-2">
                     <span className="cursor-pointer hover:underline">Cc</span>
                     <span className="cursor-pointer hover:underline">Bcc</span>
                  </div>
               </div>
               <div className="px-4 py-2 border-b border-gray-100">
                  <input 
                     type="text" 
                     placeholder="Subject"
                     className="w-full outline-none text-[14px] font-medium" 
                     value={emailData.subject}
                     onChange={e => setEmailData({...emailData, subject: e.target.value})}
                     required
                  />
               </div>

               {templates.length > 0 && (
                  <div className="px-4 py-1.5 bg-yellow-50 border-b border-gray-100 text-xs">
                     <span className="text-gray-500 mr-2">Template:</span>
                     <select 
                        className="bg-transparent font-medium text-blue-600 outline-none w-48"
                        value={selectedTemplate}
                        onChange={e => {
                           setSelectedTemplate(e.target.value);
                           const t = templates.find(temp => temp.key === e.target.value);
                           if (t) setEmailData(prev => ({...prev, subject: t.subject, body: t.body}));
                        }}
                     >
                        <option value="">None</option>
                        {templates.map(t => (
                           <option key={t.key} value={t.key}>{t.key.replace(/_/g, ' ').toUpperCase()}</option>
                        ))}
                     </select>
                  </div>
               )}

               <div className="p-4 flex-1">
                  <textarea 
                     className="w-full h-64 outline-none resize-none text-[14px] text-gray-800"
                     value={emailData.body}
                     onChange={e => setEmailData({...emailData, body: e.target.value})}
                     required
                  />
               </div>

               {/* Footer */}
               <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center bg-[#0b57d0] hover:bg-[#084298] text-white rounded-full transition-colors overflow-hidden">
                        <button type="submit" disabled={sending} className="px-4 py-2 text-sm font-medium border-r border-white/20">
                           {sending ? 'Sending...' : 'Send'}
                        </button>
                        <button type="button" className="px-2 py-2"><ChevronDownIcon className="w-4 h-4" /></button>
                     </div>
                     <div className="flex items-center gap-1 text-gray-500">
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><span className="font-serif font-bold text-lg leading-none">A</span></button>
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><PaperClipIcon className="w-5 h-5" /></button>
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><LinkIcon className="w-5 h-5" /></button>
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><FaceSmileIcon className="w-5 h-5" /></button>
                        <button type="button" className="p-1.5 hover:bg-gray-100 rounded"><PhotoIcon className="w-5 h-5" /></button>
                     </div>
                  </div>
                  <button type="button" onClick={() => setComposeOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                     <TrashIcon className="w-5 h-5" />
                  </button>
               </div>
            </form>
         </div>
      )}
    </div>
  );
}
