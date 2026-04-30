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

export default function Messenger() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

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
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [platform]);

  // 2. Fetch Messages for a conversation

  // 2. Fetch Messages for a conversation
  const fetchMessages = async (conv) => {
    if (!conv) return;
    setActiveConv(conv);
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
    const socketUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:8000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('new_message', (msg) => {
      // Refresh list to update last message/order
      fetchConversations();
      
      // If message is for current chat, add it
      setActiveConv(current => {
        if (current && msg.conversationId === current._id) {
          setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
        return current;
      });
    });

    fetchConversations();

    return () => newSocket.close();
  }, []);

  // 4. Handle Join/Leave Room
  useEffect(() => {
    if (activeConv && socket) {
      socket.emit('join_conversation', activeConv._id);
      return () => socket.emit('leave_conversation', activeConv._id);
    }
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

  const formatDateLabel = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  return (
    <div className="flex h-full w-full bg-white overflow-hidden font-sans">
      {/* LEFT: User List */}
      <div className="w-80 lg:w-96 border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black">Chats</h1>
            <div className="flex gap-2">
               <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                 <PlusCircleIcon className="w-6 h-6 text-black" />
               </button>
            </div>
          </div>

          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setPlatform('facebook')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${platform === 'facebook' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Facebook
            </button>
            <button 
              onClick={() => setPlatform('instagram')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${platform === 'instagram' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Instagram
            </button>
          </div>
          
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search Messenger"
              className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const active = activeConv?._id === conv._id;
            const lastMsgDate = conv.lastMessageAt ? formatDateLabel(conv.lastMessageAt) : '';
            
            return (
              <div 
                key={conv._id}
                onClick={() => fetchMessages(conv)}
                className={`flex items-center gap-3 px-3 py-3 mx-2 rounded-xl cursor-pointer transition-colors ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-xl font-semibold overflow-hidden">
                    {conv.client?.fullName?.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-black' : 'text-gray-900'}`}>
                      {conv.client?.fullName}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{lastMsgDate}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-black' : 'text-gray-500'}`}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full shrink-0 ml-2"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                  {activeConv.client?.fullName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">{activeConv.client?.fullName}</h2>
                  <p className="text-[10px] text-gray-500 font-medium">Active now</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-blue-600">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><PhoneIcon className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><VideoCameraIcon className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><InformationCircleIcon className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              <div className="flex flex-col items-center py-10 gap-2">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold">
                    {activeConv.client?.fullName?.charAt(0)}
                 </div>
                 <h4 className="text-lg font-bold">{activeConv.client?.fullName}</h4>
                 <p className="text-xs text-gray-500">{activeConv.platform === 'instagram' ? 'Instagram Direct' : 'Facebook Messenger'}</p>
              </div>

              {messages.map((msg, idx) => {
                const isMe = msg.sender === 'agent';
                return (
                  <div 
                    key={msg._id || idx}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                  >
                    {!isMe && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-auto">
                        {activeConv.client?.fullName?.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col max-w-[70%]">
                      <div 
                        className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-md' 
                            : 'bg-gray-100 text-black rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input */}
            <div className="p-4 flex items-center gap-3 shrink-0">
               <div className="flex gap-2 text-blue-600">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><PlusCircleIcon className="w-6 h-6" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><PhotoIcon className="w-6 h-6" /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors invisible lg:visible"><FaceSmileIcon className="w-6 h-6" /></button>
               </div>
               
               <form onSubmit={handleSend} className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
                  <input 
                    type="text" 
                    placeholder="Aa"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="button" className="text-blue-600 ml-2">
                    <FaceSmileIcon className="w-5 h-5" />
                  </button>
               </form>

               {newMessage.trim() ? (
                 <button onClick={handleSend} className="text-blue-600">
                   <PaperAirplaneIcon className="w-6 h-6" />
                 </button>
               ) : (
                 <button className="text-blue-600">
                   <HandThumbUpIcon className="w-6 h-6" />
                 </button>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <PaperAirplaneIcon className="w-10 h-10 text-blue-600 -rotate-45" />
             </div>
             <h3 className="text-xl font-bold text-gray-900">Select a chat</h3>
             <p className="text-sm">Choose from your list on the left to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
