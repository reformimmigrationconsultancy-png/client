import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  PaperAirplaneIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday } from 'date-fns';
import { Link } from 'react-router-dom';

const PLATFORM_ICONS = {
  email: { icon: EnvelopeIcon, color: 'text-amber-500 bg-amber-50' },
  whatsapp: { icon: DevicePhoneMobileIcon, color: 'text-emerald-500 bg-emerald-50' },
  facebook: { icon: GlobeAltIcon, color: 'text-blue-500 bg-blue-50' },
  instagram: { icon: GlobeAltIcon, color: 'text-pink-500 bg-pink-50' },
};

export default function Sent() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSentMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sent');
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Fetch Sent Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentMessages();
  }, []);

  const formatDateLabel = (date) => {
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const filteredMessages = messages.filter(msg => {
    const search = searchQuery.toLowerCase();
    const clientName = msg.conversationId?.client?.fullName?.toLowerCase() || '';
    const content = msg.content?.toLowerCase() || '';
    return clientName.includes(search) || content.includes(search);
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <PaperAirplaneIcon className="w-8 h-8 text-blue-600 -rotate-45" />
              Sent Messages
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              View all communications sent by your team across all platforms.
            </p>
          </div>

          <div className="relative w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search sent messages..."
              className="w-full bg-slate-100 border-none focus:ring-2 focus:ring-blue-500/20 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="text-slate-500 font-medium mt-4">Loading your sent history...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-100 flex flex-col items-center gap-4">
              <div className="p-6 bg-slate-50 rounded-full">
                <PaperAirplaneIcon className="w-16 h-16 text-slate-200 -rotate-45" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No sent messages found</h3>
              <p className="text-slate-500 max-w-sm">
                When you send emails, WhatsApp messages, or Facebook replies, they will appear here for your records.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Preview</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sent Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMessages.map((msg) => {
                    const platform = msg.conversationId?.platform || 'email';
                    const iconConfig = PLATFORM_ICONS[platform] || PLATFORM_ICONS.email;
                    const client = msg.conversationId?.client;

                    return (
                      <tr key={msg._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm">
                              {client?.fullName?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{client?.fullName || 'Unknown Client'}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{client?.email || client?.phone || 'No contact info'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 max-w-md">
                          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {msg.content?.replace(/<[^>]*>?/gm, '')}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${iconConfig.color} border border-current/10`}>
                            <iconConfig.icon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{platform}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-500 whitespace-nowrap">
                            {formatDateLabel(new Date(msg.createdAt))}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link 
                            to={`/inbox?convId=${msg.conversationId?._id}`}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-xs uppercase tracking-widest group/btn"
                          >
                            View Thread
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
