import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { EnvelopeIcon, PlusIcon, PaperAirplaneIcon, BookmarkIcon } from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';

export default function Emails() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/emails/templates');
      setTemplates(res.data.templates);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
       await api.post('/emails/send', { ...emailData, templateKey: selectedTemplate });
       toast.success('Email dispatched successfully');
       setEmailData({ to: '', subject: '', body: '' });
       setSelectedTemplate('');
    } catch (err) {
       console.error(err);
       toast.error(err.response?.data?.message || 'Dispatch failed');
    } finally {
       setSending(false);
    }
  };

  const handleTemplateSelect = (key) => {
    setSelectedTemplate(key);
    const template = templates.find((t) => t.key === key);
    if (template) {
       setEmailData({ ...emailData, subject: template.subject, body: template.body });
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest text-center">Synchronizing Email<br/>Templates...</p>
       </div>
    </div>
  );

  return (
    <div className="p-10 w-full h-full bg-[#fdfdfd] overflow-y-auto pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
       <div>
         <h2 className="text-4xl font-black text-slate-900 tracking-tight">Email Command Center</h2>
         <p className="text-slate-500 font-medium mt-2">Deploy high-impact communications using curated templates.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Templates Sidebar */}
         <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <BookmarkIcon className="w-4 h-4" /> Available Templates
            </h3>
            <div className="grid grid-cols-1 gap-3">
               {templates.map((t) => (
                 <button
                    key={t.key}
                    onClick={() => handleTemplateSelect(t.key)}
                    className={`group w-full text-left p-5 rounded-[22px] border transition-all duration-300 shadow-sm ${
                      selectedTemplate === t.key 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300 hover:shadow-lg'
                    }`}
                 >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Template Key</p>
                    <p className="text-sm font-black tracking-tight">{t.key.replace(/_/g, ' ').toUpperCase()}</p>
                 </button>
               ))}
            </div>
         </div>

         {/* Email Editor */}
         <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden p-10 space-y-8 animate-in fade-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">New Dispatch</h3>
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
            
            <form onSubmit={handleSend} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Recipient Destination</label>
                     <input
                        type="email"
                        required
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                        value={emailData.to}
                        onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                        placeholder="client@terminal.com"
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subject Header</label>
                     <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                        value={emailData.subject}
                        onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                        placeholder="Communication Subject"
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Message Content Layer</label>
                  <textarea
                     rows={10}
                     required
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-6 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner resize-none"
                     value={emailData.body}
                     onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                     placeholder="Synthesize your message here..."
                  />
               </div>

               <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={sending}
                    className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-300 transition-all active:scale-95 disabled:opacity-50 group"
                  >
                     {sending ? 'Dispatching...' : (
                        <>
                           <PaperAirplaneIcon className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                           Authorize Dispatch
                        </>
                     )}
                  </button>
               </div>
            </form>
         </div>
       </div>

      </div>
    </div>
  );
}
