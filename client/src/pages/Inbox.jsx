import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  EnvelopeOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon,
  PaperClipIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  PhotoIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import { format, isToday, isYesterday } from 'date-fns';
import ComposeModal from '../components/ComposeModal';
import toast from 'react-hot-toast';

import { BACKEND_URL } from '../utils/api';

const getBackendHost = () => {
  try {
    return new URL(BACKEND_URL).hostname;
  } catch (e) {
    return '';
  }
};
const backendHost = getBackendHost();

const getMediaUrl = (url) => {
  if (!url) return '';
  const isLocal = url.includes('localhost') || 
                  url.includes('manpreetcrm.com') ||
                  url.includes(window.location.hostname) || 
                  (backendHost && url.includes(backendHost)) || 
                  url.startsWith('/') || 
                  url.startsWith('uploads/');
  if (isLocal) {
    return url;
  }
  if (url.startsWith('http') || url.startsWith('//')) {
    return `${BACKEND_URL}/api/conversations/proxy-media?url=${encodeURIComponent(url)}`;
  }
  return url;
};

const AudioPlayer = ({ url, mimetype }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');
  const audioRef = useRef(null);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlay = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const onTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration;
    if (total) {
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
    }
  };

  const onLoadedMetadata = () => {
    setDuration(formatTime(audioRef.current.duration));
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime('0:00');
  };

  return (
    <div className="py-2 px-1 min-w-[240px] flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
        <button 
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-all active:scale-95 shadow-sm"
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 pt-1">
        <div className="h-1 bg-slate-200/50 rounded-full relative overflow-hidden cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          audioRef.current.currentTime = pos * audioRef.current.duration;
        }}>
          <div 
            className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-100" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center pr-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{isPlaying ? currentTime : duration}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" className={`${isPlaying ? 'text-blue-600' : 'text-slate-400'}`}><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
        </div>
      </div>
      <audio 
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        className="hidden"
      >
        <source src={getMediaUrl(url)} type={mimetype || 'audio/ogg'} />
      </audio>
    </div>
  );
};


const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const CHANNELS = [
  { id: 'all', name: 'ALL LEADS', icon: ChatBubbleLeftRightIcon, color: 'bg-blue-600 text-white' },
  { id: 'email', name: 'DIRECT EMAIL', icon: EnvelopeIcon, color: 'bg-amber-500 text-white' }
];

export default function Inbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const convIdParam = searchParams.get('convId');
  const [activeChannel, setActiveChannel] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const activeConvRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync ref when activeConv changes
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  const fetchConversations = async (keepActive = true) => {
    try {
      const p = {
        platform: (activeChannel !== 'all' && activeChannel !== 'archived') ? activeChannel : undefined,
        status: activeChannel === 'archived' ? 'archived' : undefined,
        search: searchQuery || undefined,
        unread: filterUnread ? 'true' : undefined,
        _t: Date.now()
      };

      const res = await api.get('/conversations', { params: p });
      setConversations(res.data.conversations || []);
      
      if (!keepActive || res.data.conversations.length === 0) {
          if (!keepActive) setActiveConv(null);
          return;
      }

      if (activeConvRef.current) {
         const isStillVisible = res.data.conversations.some(c => c._id === activeConvRef.current._id);
         if (!isStillVisible) {
            setActiveConv(null);
            activeConvRef.current = null;
            setMessages([]);
         } else {
            const updated = res.data.conversations.find(c => c._id === activeConvRef.current._id);
            if (updated) setActiveConv(updated);
         }
      } else if (convIdParam) {
         const targetConv = res.data.conversations.find(c => c._id === convIdParam);
         if (targetConv) {
            fetchMessages(targetConv);
         } else if (res.data.conversations.length > 0) {
            fetchMessages(res.data.conversations[0]);
         }
      } else if (res.data.conversations.length > 0) {
         fetchMessages(res.data.conversations[0]);
      }
    } catch (err) {
      console.error('Fetch Conversations Error:', err);
    }
  };

  const fetchMessages = async (conv) => {
    if (!conv) return;
    setActiveConv(conv);
    activeConvRef.current = conv;
    try {
      const res = await api.get(`/conversations/${conv._id}/messages`);
      setMessages(res.data.messages);
      scrollToBottom();
      fetchConversations(true);
    } catch (err) {
      console.error('Fetch Messages Error:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeChannel, searchQuery, filterUnread]);

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const messageHandler = (msg) => {
      const msgConvId = typeof msg.conversationId === 'object' ? msg.conversationId._id : msg.conversationId;
      if (activeConv && msgConvId === activeConv._id) {
         setMessages((prev) => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
         });
         scrollToBottom();
      }
      fetchConversations(true);
    };
    socket.on('new_message', messageHandler);
    return () => socket.off('new_message', messageHandler);
  }, [socket, activeConv]);

  useEffect(() => {
     if (!activeConv || !socket) return;
     
     const joinRoom = () => socket.emit('join_conversation', activeConv._id);
     
     if (socket.connected) {
       joinRoom();
     } else {
       socket.once('connect', joinRoom);
     }
     
     return () => {
       socket.off('connect', joinRoom);
       if (socket.connected) socket.emit('leave_conversation', activeConv._id);
     };
  }, [activeConv, socket]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
         messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConv) return;
    const formData = new FormData();
    formData.append('file', file);
    const tId = toast.loading('Sending image...');
    try {
      const uploadRes = await api.post('/upload', formData);
      const imageUrl = uploadRes.data.url;
      await api.post(`/conversations/${activeConv._id}/messages`, {
        content: 'Sent an image',
        messageType: 'image',
        imageUrl: imageUrl,
        attachments: [{ url: imageUrl, mimetype: file.type, originalName: file.name }]
      });
      toast.success('Image sent', { id: tId });
      fetchMessages(activeConv);
    } catch (err) {
      console.error('Upload Error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Upload failed';
      toast.error(errMsg, { id: tId });
    }
  };

  const handleLike = async () => {
    if (!activeConv) return;
    try {
      await api.post(`/conversations/${activeConv._id}/messages`, {
        content: '👍',
        messageType: 'text'
      });
      fetchMessages(activeConv);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    const content = newMessage;
    setNewMessage('');
    try {
       await api.post(`/conversations/${activeConv._id}/messages`, {
         content: content,
         messageType: 'text'
       });
       fetchMessages(activeConv);
    } catch (err) {
       console.error(err);
       setNewMessage(content);
       const errMsg = err.response?.data?.message || 'Failed to send message';
       toast.error(errMsg);
    }
  };

  const updateStatus = async (status) => {
     try {
       await api.put(`/conversations/${activeConv._id}`, { status });
       toast.success(`Conversation marked as ${status}`);
       if (status === 'archived') {
          setActiveConv(null);
          setMessages([]);
       } else {
          setActiveConv({ ...activeConv, status });
       }
       fetchConversations(status !== 'archived');
     } catch(err) {
       console.error(err);
       toast.error('Failed to update status');
     }
  };

  const markUnread = async () => {
     try {
       await api.put(`/conversations/${activeConv._id}`, { unreadCount: 1 });
       toast.success('Conversation marked as unread');
       fetchConversations(true);
     } catch (err) {
       console.error(err);
       toast.error('Failed to update status');
     }
  };

  const deleteConversation = async () => {
     if (!activeConv || !window.confirm('This will permanently delete this conversation. Continue?')) return;
     try {
        await api.delete(`/conversations/${activeConv._id}`);
        toast.success('Deleted successfully');
        setActiveConv(null);
        setMessages([]);
        fetchConversations(false);
     } catch (err) {
        console.error(err);
        toast.error('Failed to delete');
     }
  };

  const formatDateLabel = (date) => {
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  return (
    <div className="flex bg-slate-50 flex-1 overflow-hidden h-full w-full min-h-0">
      {/* 1. Side Navigation (Channels) */}
      <div className="w-16 lg:w-64 bg-white border-r border-slate-100 flex-col transition-all duration-300 min-h-0 hidden md:flex">
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
           <h2 className="hidden lg:block text-[10px] font-bold text-slate-400 tracking-widest uppercase">Communications</h2>
           <button 
              onClick={() => setIsComposeOpen(true)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm active:scale-95 group"
              title="Compose Message"
            >
              <PlusIcon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
           </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {CHANNELS.map((ch) => {
            const active = ch.id === activeChannel;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full group relative flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                 <div className={`p-1.5 rounded-lg transition-all ${active ? ch.color : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'}`}>
                    <ch.icon className="h-4 w-4" />
                 </div>
                 <span className="hidden lg:inline text-[11px] font-bold uppercase tracking-wider leading-none">{ch.name}</span>
                 {active && <div className="absolute right-4 w-1.5 h-1.5 bg-blue-400 rounded-full hidden lg:block" />}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 2. Middle Panel (Conversation List) */}
      <div className={`w-full md:w-72 lg:w-80 border-r border-slate-200 flex-col bg-white shadow-sm z-20 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 flex flex-col gap-3 border-b border-slate-100 sticky top-0 bg-white shadow-sm z-10">
           <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                 type="text" 
                 placeholder="Search..."
                 className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-2 pl-10 pr-4 text-sm font-medium transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1 pr-4 no-scrollbar">
               <button 
                 onClick={() => setFilterUnread(!filterUnread)}
                 className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border uppercase tracking-wider whitespace-nowrap ${filterUnread ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
               >
                 Unread
               </button>
                <button className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white text-slate-500 border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap">
                   <FunnelIcon className="w-3 h-3 text-slate-400" />
                   Filter
                </button>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-10">
           {conversations.length === 0 ? (
             <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="p-4 bg-slate-50 rounded-full">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">No conversations here</p>
             </div>
           ) : (
             <div className="divide-y divide-slate-50">
                {conversations
                  .filter(c => {
                    if (activeChannel === 'all') return c.status !== 'archived';
                    if (activeChannel === 'archived') return c.status === 'archived';
                    return c.platform === activeChannel && c.status !== 'archived';
                  })
                  .map((conv) => {
                   const active = activeConv?._id === conv._id;
                   const channelInfo = CHANNELS.find(c => c.id === conv.platform) || CHANNELS[0];
                   return (
                     <div 
                       key={conv._id} 
                       onClick={() => fetchMessages(conv)}
                       className={`px-5 py-4 cursor-pointer transition-all relative flex gap-4 ${active ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                     >
                        {/* Status Indicator */}
                        {conv.unreadCount > 0 && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-10 bg-blue-600 rounded-r-full" />
                        )}
                        
                        {/* Avatar */}
                        <div className="relative shrink-0">
                           <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-800 font-bold text-lg shadow-sm border border-slate-200 ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                              {conv.client?.fullName?.charAt(0) || 'C'}
                           </div>
                           <div className={`absolute -bottom-1 -right-1 p-1 rounded-lg border-2 border-white shadow-sm ${channelInfo.color.split(' ')[0]} bg-white`}>
                              <channelInfo.icon className="w-2.5 h-2.5" />
                           </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                           <div className="flex justify-between items-baseline mb-0.5">
                              <h4 className={`text-sm tracking-tight truncate ${conv.unreadCount > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                {conv.client?.fullName || 'Unknown'}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2 shrink-0">
                                {conv.lastMessageAt ? formatDateLabel(new Date(conv.lastMessageAt)) : ''}
                              </span>
                           </div>
                           <p className={`text-xs truncate transition-colors ${conv.unreadCount > 0 ? 'font-bold text-slate-700' : 'font-medium text-slate-400'}`}>
                              {conv.lastMessage || 'Start a conversation...'}
                           </p>
                           
                           <div className="flex items-center gap-1.5 mt-2">
                              {conv.status === 'resolved' && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter border border-emerald-100">Resolved</span>
                              )}
                              {conv.status === 'pending' && (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-tighter border border-amber-100">Pending</span>
                              )}
                              {conv.unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">{conv.unreadCount}</span>
                              )}
                           </div>
                        </div>
                     </div>
                   )
                })}
             </div>
           )}
        </div>
      </div>

      {/* 3. Main Chat View */}
      <div className={`flex-1 flex-col bg-white overflow-hidden relative shadow-inner z-10 min-h-0 ${activeConv ? 'flex' : 'hidden md:flex'}`}>
         {activeConv ? (
            <>
              {/* Header */}
               <div className="h-20 px-4 md:px-8 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-30">
                  <div className="flex items-center gap-2 md:gap-4 min-w-0">
                     {/* Back Button for mobile */}
                     <button
                        onClick={() => {
                           setActiveConv(null);
                           setSearchParams({});
                        }}
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all mr-1 shrink-0"
                        title="Back to list"
                     >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                     </button>
                     <div className="relative group cursor-pointer">
                       <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transition-all active:scale-95">
                          {activeConv.client?.fullName?.charAt(0) || 'C'}
                       </div>
                       <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" title="Client is online" />
                     </div>
                     <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight leading-none truncate">{activeConv.client?.fullName}</h2>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                           <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{activeConv.platform}</p>
                           <span className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                           <p className="text-[9px] md:text-[10px] font-medium text-slate-400 truncate max-w-[120px] md:max-w-[200px]">{activeConv.client?.email || activeConv.client?.phone || 'No contact details'}</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
                     <button 
                       onClick={() => updateStatus('resolved')}
                       className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] md:text-[11px] font-bold rounded-lg border border-emerald-200 transition-all active:scale-95"
                       title="Mark as Resolved"
                     >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Resolve</span>
                     </button>
                     
                     <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1 md:mx-2" />
                     
                     <div className="flex gap-0.5 md:gap-1">
                        <button onClick={markUnread} className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all" title="Mark as Unread">
                           <EnvelopeOpenIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus('archived')} className="p-1.5 md:p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-all" title="Archive">
                           <ArchiveBoxIcon className="w-4 h-4" />
                        </button>
                        <button onClick={deleteConversation} className="p-1.5 md:p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all" title="Delete">
                           <TrashIcon className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>

               {/* Messages Area */}
               <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8 bg-[#fdfdfd] w-full relative pattern-bg min-h-0">
                 <div className="max-w-4xl mx-auto space-y-12 pb-10">
                    <div className="flex items-center justify-center">
                       <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200/50 flex items-center gap-2">
                          <div className="w-1 h-1 bg-slate-400 rounded-full" />
                          Conversation started on {format(new Date(activeConv.createdAt), 'MMMM d, yyyy')}
                          <div className="w-1 h-1 bg-slate-400 rounded-full" />
                       </span>
                    </div>

                    {messages.map((msg, idx) => {
                        const isAgent = msg.sender === 'agent';
                        const showAvatar = idx === 0 || messages[idx-1].sender !== msg.sender;

                        return (
                          <div 
                            key={msg._id || idx} 
                            className={`flex w-full min-w-0 ${isAgent ? 'justify-end' : 'justify-start'}`}
                          >
                             <div className={`flex max-w-[85%] gap-3 min-w-0 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-7 h-7 rounded-lg shrink-0 mt-auto flex items-center justify-center font-bold text-[9px] border shadow-sm ${showAvatar ? 'opacity-100' : 'opacity-0'} ${isAgent ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-700 border-slate-200'}`}>
                                   {isAgent ? user?.name?.charAt(0) : activeConv.client?.fullName?.charAt(0)}
                                </div>
                                
                                <div className={`flex flex-col min-w-0 ${isAgent ? 'items-end' : 'items-start'}`}>
                                   {msg.messageType === 'image' || (msg.attachments && msg.attachments.length > 0) ? (
                                      <div className="space-y-2">
                                         {(msg.attachments || []).map((att, aIdx) => (
                                            <div key={aIdx} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-[280px]">
                                               {att.mimetype?.startsWith('image/') || msg.messageType === 'image' ? (
                                                  <img src={getMediaUrl(att.url || msg.content)} alt="Attachment" className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(att.url || msg.content, '_blank')} />
                                               ) : att.mimetype?.startsWith('audio/') || msg.messageType === 'audio' || att.url?.toLowerCase().endsWith('.ogg') || att.url?.toLowerCase().endsWith('.mp3') || att.filename?.toLowerCase().endsWith('.ogg') ? (
                                                  <AudioPlayer url={att.url} mimetype={att.mimetype} />
                                               ) : att.mimetype?.startsWith('video/') || msg.messageType === 'video' || att.url?.toLowerCase().endsWith('.mp4') ? (
                                                  <video controls className="w-full max-h-[300px]">
                                                     <source src={getMediaUrl(att.url)} type={att.mimetype || 'video/mp4'} />
                                                  </video>
                                               ) : (
                                                  <div className="p-3 bg-slate-50 flex items-center gap-3">
                                                     <PaperClipIcon className="w-5 h-5 text-slate-400" />
                                                     <span className="text-xs font-medium text-slate-600 truncate">{att.originalName || 'Attachment'}</span>
                                                  </div>
                                               )}
                                            </div>
                                         ))}
                                         {msg.content && !msg.content.startsWith('[') && (
                                            <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed ${isAgent ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                                               {msg.content}
                                            </div>
                                         )}
                                      </div>
                                   ) : (
                                      <div 
                                         className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed whitespace-pre-wrap break-words break-all overflow-y-auto max-h-[60vh] custom-scrollbar transition-all ${isAgent ? 'bg-blue-600 text-white rounded-br-sm shadow-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}
                                         dangerouslySetInnerHTML={{ __html: (msg.content?.startsWith('[') && msg.content?.endsWith(']')) ? '' : msg.content.replace(/<[^>]*>?/gm, '') }}
                                      />
                                   )}
                                   {msg.messageType === 'email' && <div className="mt-2 pt-2 border-t border-white/20 text-[9px] italic opacity-70">via Email</div>}
                                   <div className="mt-1 px-1">
                                      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">
                                        {format(new Date(msg.createdAt), 'h:mm a')}
                                      </span>
                                   </div>
                                </div>
                             </div>
                          </div>
                        )
                    })}
                    <div ref={messagesEndRef} className="h-4" />
                 </div>
               </div>

                {/* Input Box */}
                <div className="px-4 md:px-8 py-4 md:py-6 border-t border-slate-100 bg-white/80 backdrop-blur-md sticky bottom-0 z-30">
                  <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSend} className="flex items-center gap-2 group">
                        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                           <button type="button" className="p-1 md:p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                              <PlusCircleIcon className="w-5 h-5 md:w-6 md:h-6" />
                           </button>
                           <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 md:p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                              <PhotoIcon className="w-5 h-5 md:w-6 md:h-6" />
                              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                           </button>
                           <button type="button" className="hidden sm:block p-1 md:p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                              <FaceSmileIcon className="w-5 h-5 md:w-6 md:h-6" />
                           </button>
                        </div>

                        <div className="flex-1 relative">
                           <textarea 
                              className="w-full bg-slate-100 border-none focus:bg-white focus:ring-1 focus:ring-slate-200 rounded-2xl py-2.5 px-4 text-[14px] font-medium transition-all resize-none h-[42px] max-h-48 overflow-y-auto pr-10"
                              placeholder="Type a message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                 }
                              }}
                              disabled={activeConv.status === 'resolved'}
                           />
                           <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                              <FaceSmileIcon className="w-5 h-5" />
                           </button>
                        </div>
                        
                        {newMessage.trim() ? (
                           <button 
                             type="submit" 
                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-95"
                           >
                              <PaperAirplaneIcon className="w-6 h-6 -rotate-45" />
                           </button>
                        ) : (
                           <button 
                             type="button" 
                             onClick={handleLike}
                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-95"
                           >
                              <HandThumbUpIcon className="w-6 h-6" />
                           </button>
                        )}
                    </form>
                    <div className="mt-3 flex items-center justify-between">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full pulse" />
                          Customer will be notified via {activeConv.platform}
                       </p>
                       <div className="flex gap-4">
                          <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Apply Template</button>
                          <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Insert Variable</button>
                       </div>
                    </div>
                  </div>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pattern-bg" />
               <div className="relative z-10 text-center flex flex-col items-center">
                  <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-10 ring-1 ring-slate-100 rotate-6 hover:rotate-0 transition-transform duration-500">
                    <ChatBubbleLeftRightIcon className="w-16 h-16 text-blue-500/50" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Unified Inbox</h3>
                  <p className="text-slate-500 font-medium max-w-xs leading-relaxed">
                    Select a message from the panel to start collaborating with your leads.
                  </p>
                  
                  <div className="mt-12 flex gap-4">
                     {CHANNELS.slice(1).map(ch => (
                        <div key={ch.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                           <div className={`p-4 rounded-2xl ${ch.color} group-hover:scale-110 transition-transform shadow-sm`}>
                              <ch.icon className="w-6 h-6" />
                           </div>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ch.id}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>

      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        onSent={() => fetchConversations()}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .pattern-bg {
          background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .pulse {
          animation: pulse-animation 2s infinite;
        }
        @keyframes pulse-animation {
          0% { box-shadow: 0 0 0 0px rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
        }
      `}} />
    </div>
  );
}
