import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { 
  PaperAirplaneIcon, 
  MagnifyingGlassIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  PlusCircleIcon,
  PhotoIcon,
  FaceSmileIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/solid';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

const isDev = import.meta.env.DEV;
const hasLeadPrefix = window.location.pathname.startsWith('/lead');
const BACKEND_URL = isDev 
  ? `${window.location.protocol}//${window.location.hostname}:8000` 
  : `${window.location.origin}${hasLeadPrefix ? '/lead' : ''}`;

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
      <div className="w-10 h-10 rounded-full bg-[#00a884]/10 flex items-center justify-center shrink-0">
        <button 
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-all active:scale-95 shadow-sm"
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 pt-1">
        <div className="h-1 bg-gray-200/50 rounded-full relative overflow-hidden cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          audioRef.current.currentTime = pos * audioRef.current.duration;
        }}>
          <div 
            className="absolute left-0 top-0 h-full bg-[#00a884] transition-all duration-100" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center pr-2">
          <span className="text-[10px] text-gray-500 font-medium">{isPlaying ? currentTime : duration}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" className={`${isPlaying ? 'text-[#00a884]' : 'text-gray-400'}`}><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
        </div>
      </div>
      <audio 
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        className="hidden"
      >
        <source src={`${BACKEND_URL}/api/conversations/proxy-media?url=${encodeURIComponent(url)}`} type={mimetype || 'audio/ogg'} />
      </audio>
    </div>
  );
};


export default function Messenger() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const activeConvRef = useRef(null);

  const [platform, setPlatform] = useState('facebook');

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations', { 
        params: { platform: platform } 
      });
      setConversations(res.data.conversations || []);
      
      // Auto-select first conversation if none selected or if platform changed
      if (res.data.conversations?.length > 0) {
        // If current active conv is from a different platform, switch it
        if (!activeConv || activeConv.platform !== platform) {
           fetchMessages(res.data.conversations[0]);
        }
      } else {
        setActiveConv(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Fetch Conversations Error:', err);
      toast.error('Failed to load conversations');
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [platform]);

  const formatDateLabel = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  const [showEmojis, setShowEmojis] = useState(false);
  const commonEmojis = ['😊', '😂', '😍', '👍', '🙏', '🔥', '🤔', '🙌', '🎉', '❤️', '✅', '❌', '📍', '📞', '🤝'];

  // Sync conversations from Meta (Facebook/Instagram)
  const handleSync = async () => {
    setSyncing(true);
    try {
      const endpoint = platform === 'instagram' ? '/conversations/sync/instagram' : '/conversations/sync/facebook';
      const res = await api.post(endpoint);
      const count = res.data.count || 0;
      if (count > 0) {
        toast.success(`✅ Synced ${count} new ${platform} conversation${count > 1 ? 's' : ''}!`);
      } else {
        toast('No new conversations found.', { icon: 'ℹ️' });
      }
      fetchConversations();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(`Sync failed: ${errMsg}`);
      console.error('Sync Error:', err);
    } finally {
      setSyncing(false);
    }
  };

  // 2. Fetch Messages for a conversation
  const fetchMessages = async (conv) => {
    if (!conv) return;
    setActiveConv(conv);
    activeConvRef.current = conv;
    try {
      const res = await api.get(`/conversations/${conv._id}/messages`);
      setMessages(res.data.messages);
      
      // Mark as read
      if (conv.unreadCount > 0) {
        await api.put(`/conversations/${conv._id}`, { unreadCount: 0 });
        fetchConversations();
      }
    } catch (err) {
      console.error('Fetch Messages Error:', err);
    }
  };

  // 3. Socket Setup
  useEffect(() => {
    const socketUrl = isDev ? `${window.location.protocol}//${window.location.hostname}:8000` : window.location.origin;
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on('new_message', (msg) => {
      // Refresh list to update last message/order
      fetchConversations();
      
      // Use ref to avoid stale closure — check if msg belongs to active conv
      const currentConv = activeConvRef.current;
      const msgConvId = typeof msg.conversationId === 'object' ? msg.conversationId._id : msg.conversationId;
      if (currentConv && msgConvId === currentConv._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => newSocket.close();
  }, []);

  // 4. Handle Join/Leave Room — wait for socket connection before emitting
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

  // 5. Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 6. Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    
    const content = newMessage;
    setNewMessage('');
    
    try {
      const res = await api.post(`/conversations/${activeConv._id}/messages`, {
        content: content,
        messageType: 'text'
      });
      // Message will be added via socket or manual update
      setMessages(prev => [...prev, res.data.message]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send message';
      toast.error(errMsg);
      setNewMessage(content);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#efeae2] overflow-hidden font-sans">
      {/* LEFT: User List */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col h-full shadow-lg z-10 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-[#f0f2f5] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#111b21]">Chats</h1>
            <div className="flex gap-3">
               <button 
                 onClick={handleSync}
                 disabled={syncing}
                 className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-all active:scale-90"
                 title="Sync Messages"
               >
                 <svg className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               </button>
            </div>
          </div>
          
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button onClick={() => setPlatform('facebook')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${platform === 'facebook' ? 'bg-[#00a884] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Facebook</button>
            <button onClick={() => setPlatform('instagram')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${platform === 'instagram' ? 'bg-[#00a884] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Instagram</button>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search or start new chat"
              className="w-full bg-white border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#00a884] shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {conversations.map((conv) => {
            const active = activeConv?._id === conv._id;
            const lastMsgDate = conv.lastMessageAt ? formatDateLabel(conv.lastMessageAt) : '';
            return (
              <div 
                key={conv._id}
                onClick={() => fetchMessages(conv)}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${active ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'}`}
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-inner overflow-hidden">
                  {conv.client?.fullName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 border-gray-100">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-[15px] font-semibold text-[#111b21] truncate">{conv.client?.fullName}</h3>
                    <span className={`text-[11px] ${conv.unreadCount > 0 ? 'text-[#00a884] font-bold' : 'text-gray-500'}`}>{lastMsgDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[13px] text-gray-500 truncate leading-tight flex-1">
                      {conv.lastMessage || 'Start chat'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-[#00a884] text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 ml-2 shadow-sm">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Chat Area */}
      <div className={`flex-1 flex-col h-full relative min-w-0 ${activeConv ? 'flex' : 'hidden md:flex'}`} style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/580/630/HD-wallpaper-whatsapp-plain-background-whatsapp-green-gradient.jpg")', backgroundSize: 'cover' }}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="h-[60px] px-4 bg-[#f0f2f5] flex items-center justify-between shrink-0 border-b border-gray-200 shadow-sm z-20">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setActiveConv(null);
                    activeConvRef.current = null;
                  }}
                  className="md:hidden p-1 mr-1 hover:bg-gray-200 rounded-full transition-colors shrink-0"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold shadow-sm">
                  {activeConv.client?.fullName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#111b21] leading-tight">{activeConv.client?.fullName}</h2>
                  <p className="text-[11px] text-gray-500 font-medium">online</p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-gray-600">
                <button className="hover:text-[#00a884] transition-colors"><PhoneIcon className="w-5 h-5" /></button>
                <button className="hover:text-[#00a884] transition-colors"><VideoCameraIcon className="w-5 h-5" /></button>
                <button className="hover:text-[#00a884] transition-colors"><InformationCircleIcon className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-1.5 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isMe = msg.sender === 'agent';
                
                return (
                  <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className={`relative px-3 pt-1.5 pb-2 rounded-lg shadow-sm text-[14px] max-w-[85%] min-w-[90px] ${isMe ? 'bg-[#dcf8c6] text-[#111b21] rounded-tr-none' : 'bg-white text-[#111b21] rounded-tl-none'}`}>
                      {(msg.attachments && msg.attachments.length > 0) && (
                         <div className="mb-2">
                            {(msg.attachments || []).map((att, aIdx) => (
                               <div key={aIdx} className="rounded-md overflow-hidden max-w-[300px]">
                                  {att.mimetype?.startsWith('image/') || msg.messageType === 'image' ? (
                                     <img 
                                       src={att.url?.includes('fbcdn') || att.url?.includes('fbsbx') ? `${BACKEND_URL}/api/conversations/proxy-media?url=${encodeURIComponent(att.url)}` : (att.url || msg.content)} 
                                       className="w-full h-auto cursor-pointer border border-black/5" 
                                       onClick={() => window.open(att.url || msg.content, '_blank')} 
                                     />
                                  ) : att.mimetype?.startsWith('audio/') || msg.messageType === 'audio' || att.url?.toLowerCase().endsWith('.ogg') || att.url?.toLowerCase().endsWith('.mp3') || att.filename?.toLowerCase().endsWith('.ogg') ? (
                                     <AudioPlayer url={att.url} mimetype={att.mimetype} />
                                  ) : att.mimetype?.startsWith('video/') || msg.messageType === 'video' || att.url?.toLowerCase().endsWith('.mp4') ? (
                                     <video controls className="w-full max-h-[250px]">
                                        <source src={att.url} type={att.mimetype || 'video/mp4'} />
                                     </video>
                                  ) : (
                                     <div className="p-3 bg-gray-50 flex items-center gap-3">
                                        <span className="text-xs font-medium text-gray-600 truncate">{att.filename || 'Attachment'}</span>
                                     </div>
                                  )}
                               </div>
                            ))}
                         </div>
                      )}
                      <div className="whitespace-pre-wrap break-words pr-20 pb-1">
                        {msg.content?.startsWith('[') && msg.content?.endsWith(']') ? '' : msg.content}
                      </div>
                      <div className="absolute bottom-1 right-1 flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                        {isMe && <span className="text-[10px] text-blue-500">✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Emoji Picker Popover */}
            {showEmojis && (
              <div className="absolute bottom-20 left-4 bg-white p-3 rounded-2xl shadow-2xl border border-gray-100 flex flex-wrap gap-2 w-64 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
                {commonEmojis.map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojis(false);
                    }}
                    className="text-xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Footer Input */}
            <div className="p-3 bg-[#f0f2f5] flex items-center gap-3 shrink-0 z-20">
               <div className="flex gap-1">
                  <button onClick={() => setShowEmojis(!showEmojis)} className={`p-2 rounded-full transition-colors ${showEmojis ? 'text-[#00a884] bg-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                    <FaceSmileIcon className="w-6 h-6" />
                  </button>
                  <label className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors cursor-pointer relative">
                      <PlusCircleIcon className="w-6 h-6" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file || !activeConv) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          const tId = toast.loading('Sending image...');
                          try {
                            const uploadRes = await api.post('/upload', formData);
                            const imageUrl = uploadRes.data.url;
                            const res = await api.post(`/conversations/${activeConv._id}/messages`, {
                              content: 'Sent an image',
                              messageType: 'image',
                              imageUrl: imageUrl,
                              attachments: [{ url: imageUrl, mimetype: file.type, originalName: file.name }]
                            });
                            setMessages(prev => [...prev, res.data.message]);
                            toast.success('Sent!', { id: tId });
                          } catch (err) {
                            toast.error('Failed!', { id: tId });
                          }
                        }}
                      />
                  </label>
               </div>
               
               <form onSubmit={handleSend} className="flex-1 flex items-center bg-white rounded-xl px-4 py-1 shadow-sm border border-gray-100">
                  <input 
                    type="text" 
                    placeholder="Type a message"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-1.5 text-[#111b21]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
               </form>

               {newMessage.trim() ? (
                 <button onClick={handleSend} className="p-2 bg-[#00a884] text-white rounded-full shadow-md active:scale-90 transition-all">
                   <PaperAirplaneIcon className="w-6 h-6 -rotate-12" />
                 </button>
               ) : (
                 <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
                    <svg viewBox="0 0 24 24" width="24" height="24" className=""><path fill="currentColor" d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.235-3.531c0 3.177-2.353 5.882-5.412 6.353v3.177h-1.647v-3.177c-3.059-.47-5.412-3.176-5.412-6.353H4c0 4 3.059 7.294 7.059 7.765v3.177h1.647v-3.177c4-.471 7.059-3.765 7.059-7.765h-1.53z"></path></svg>
                 </button>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#f8f9fa] border-b-4 border-[#00a884]">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md">
                <PaperAirplaneIcon className="w-12 h-12 text-[#00a884] -rotate-45" />
             </div>
             <h3 className="text-2xl font-light text-[#41525d] mb-2">WhatsApp for LeadFlow</h3>
             <p className="text-sm text-[#667781] max-w-xs text-center">Send and receive messages without keeping your phone online. Use WhatsApp on up to 4 linked devices and 1 phone at the same time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
