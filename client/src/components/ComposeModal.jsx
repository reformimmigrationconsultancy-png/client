import { useState, useEffect } from 'react';
import api from '../utils/api';
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ComposeModal({ isOpen, onClose, onSent }) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length > 1) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await api.get(`/clients?search=${search}&limit=5`);
          setClients(res.data.clients);
        } catch (err) {
          console.error(err);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setClients([]);
    }
  }, [search]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    if (!subject.trim() || !content.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/emails/send', {
        clientId: selectedClient._id,
        to: selectedClient.email,
        subject,
        body: content,
      });
      toast.success('Email sent successfully');
      setSubject('');
      setContent('');
      setSelectedClient(null);
      setSearch('');
      onSent();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">New Message</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700">
             <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
          {/* TO FIELD */}
          <div className="relative">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">To</label>
             {selectedClient ? (
               <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {selectedClient.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{selectedClient.fullName}</p>
                      <p className="text-xs text-blue-600">{selectedClient.email || 'No email'}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedClient(null)} className="text-blue-400 hover:text-blue-600 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
               </div>
             ) : (
               <>
                 <input 
                    type="text" 
                    placeholder="Search client name or email..."
                    className="w-full rounded-xl border-slate-200 py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                 />
                 {clients.length > 0 && (
                   <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl mt-1 shadow-xl overflow-hidden divide-y divide-slate-50">
                      {clients.map(client => (
                        <button 
                          key={client._id}
                          type="button"
                          onClick={() => setSelectedClient(client)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                            {client.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{client.fullName}</p>
                            <p className="text-xs text-slate-500">{client.email || 'No email'}</p>
                          </div>
                        </button>
                      ))}
                   </div>
                 )}
               </>
             )}
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
             <input 
                type="text" 
                placeholder="Enter subject..."
                className="w-full rounded-xl border-slate-200 py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
             />
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Message Body</label>
             <textarea 
                placeholder="Write your message here..."
                className="flex-1 w-full rounded-xl border-slate-200 p-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all resize-none bg-slate-50/30"
                value={content}
                onChange={(e) => setContent(e.target.value)}
             />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
             <div className="flex gap-2">
                 <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Attach file">
                    <PaperClipIcon className="w-5 h-5" />
                 </button>
             </div>
             <div className="flex gap-3">
               <button 
                 type="button" 
                 onClick={onClose}
                 className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
               >
                 Cancel
               </button>
               <button 
                 type="submit" 
                 disabled={loading || !selectedClient || !subject || !content}
                 className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95"
               >
                 {loading ? 'Sending...' : (
                   <>
                     Send Email
                     <PaperAirplaneIcon className="w-4 h-4 -rotate-45" />
                   </>
                 )}
               </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
}
