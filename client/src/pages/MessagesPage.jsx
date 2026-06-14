import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { messageService, transactionService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [searchParams] = useSearchParams();
  const initialUser = searchParams.get('user');

  const [conversations, setConversations] = useState([]);
  const [partners, setPartners] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [showChat, setShowChat] = useState(false); // mobile: false=sidebar, true=chat
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user?._id) return;

    const fetchConvos = messageService.getConversations().then(({ data }) => data.conversations);
    const fetchPartners = transactionService.getAll({ limit: 100 }).then(({ data }) => {
      const uniquePartners = [];
      const seen = new Set();
      data.transactions.forEach(t => {
        const other = t.seller?._id === user._id ? t.buyer : t.seller;
        if (other && other._id && other._id !== user._id && !seen.has(other._id)) {
          seen.add(other._id);
          uniquePartners.push(other);
        }
      });
      return uniquePartners;
    });

    Promise.all([fetchConvos, fetchPartners])
      .then(([convos, uniquePartners]) => {
        setConversations(convos);
        setPartners(uniquePartners);

        if (initialUser) {
          const existingConvo = convos.find(c => c.user._id === initialUser);
          if (existingConvo) {
            setActiveUser(existingConvo.user);
          } else {
            const partnerUser = uniquePartners.find(p => p._id === initialUser);
            if (partnerUser) {
              setActiveUser(partnerUser);
            } else {
              setActiveUser({ _id: initialUser, name: 'Partner' });
            }
          }
        } else if (convos.length > 0) {
          setActiveUser(convos[0].user);
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoadingConvos(false);
        setLoadingPartners(false);
      });
  }, [initialUser, user?._id]);

  useEffect(() => {
    if (activeUser?._id) {
      messageService.getMessages(activeUser._id)
        .then(({ data }) => {
          setMessages(data.messages);
          scrollToBottom();
          
          // Clear unread count locally
          setConversations(prev => prev.map(c => 
            c.user._id === activeUser._id ? { ...c, unreadCount: 0 } : c
          ));
        })
        .catch(console.error);
    }
  }, [activeUser]);

  useEffect(() => {
    if (socket && user) {
      const joinRoom = () => socket.emit('joinUser', user._id);
      joinRoom();
      socket.on('connect', joinRoom);
      
      socket.on('receiveMessage', (msg) => {
        const senderId    = msg.sender?._id   || msg.sender;
        const receiverId  = msg.receiver?._id || msg.receiver;
        const activeId    = activeUser?._id;

        if (activeId && (senderId === activeId || receiverId === activeId)) {
          setMessages(prev => {
            if (prev.find(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        }

        setConversations(prev => {
          const otherUserId = senderId === user._id ? receiverId : senderId;
          const otherUser   = senderId === user._id ? (msg.receiver?._id ? msg.receiver : null) : (msg.sender?._id ? msg.sender : null);
          if (!otherUser) return prev;

          const existingIdx = prev.findIndex(c => c.user._id === otherUserId);
          const isFromActive = activeUser?._id === otherUserId;

          if (existingIdx > -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              lastMessage: msg,
              unreadCount: (!isFromActive && senderId !== user._id) ? updated[existingIdx].unreadCount + 1 : 0,
            };
            return updated.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
          } else {
            return [{ user: otherUser, lastMessage: msg, unreadCount: (!isFromActive && senderId !== user._id) ? 1 : 0 }, ...prev];
          }
        });
      });

      return () => {
        socket.off('connect', joinRoom);
        socket.off('receiveMessage');
      };
    }
  }, [socket, user, activeUser]);

  const handleSelectUser = (u) => {
    setActiveUser(u);
    setShowChat(true); // on mobile, switch to chat view
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;

    try {
      await messageService.sendMessage(activeUser._id, newMessage);
      setNewMessage('');
    } catch {
      toast.error('Failed to send message');
    }
  };

  const getSenderId = (msg) => msg.sender?._id || msg.sender;

  return (
    <div className="min-h-screen pt-16 md:pt-20 pb-0 md:pb-12 px-0 md:px-4 flex justify-center">
      <div className="max-w-6xl w-full flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[80vh] glass-card overflow-hidden">
        
        {/* Sidebar — full width on mobile when showChat=false */}
        <div className={`${showChat ? 'hidden md:flex' : 'flex'} md:flex flex-col w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 bg-dark-400 h-full`}>
          <div className="p-4 border-b border-white/10 font-display font-bold text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-eco-500" /> Inbox
          </div>
          
          {/* Active Chats */}
          <div className="flex-[3] overflow-y-auto border-b border-white/10 custom-scrollbar">
            <div className="p-3 text-[10px] font-bold text-eco-500 uppercase tracking-wider bg-white/[0.01]">Recent Chats</div>
            {loadingConvos ? (
              <div className="p-8 text-center text-eco-700">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-eco-700 text-sm">No recent conversations</div>
            ) : (
              conversations.map(c => (
                <button
                  key={c.user._id}
                  onClick={() => handleSelectUser(c.user)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-start gap-3 ${activeUser?._id === c.user._id ? 'bg-white/10' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-eco-600/20 flex-shrink-0 flex items-center justify-center font-bold text-eco-400">
                    {c.user.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-eco-100 truncate">{c.user.companyName || c.user.name}</span>
                      {c.unreadCount > 0 && (
                        <span className="bg-eco-500 text-dark-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${c.unreadCount > 0 ? 'text-white font-medium' : 'text-eco-600'}`}>
                      {getSenderId(c.lastMessage) === user._id ? 'You: ' : ''}{c.lastMessage?.text}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Trading Partners */}
          <div className="flex-[2] overflow-y-auto flex flex-col bg-dark-500 custom-scrollbar">
            <div className="p-3 text-[10px] font-bold text-eco-500 uppercase tracking-wider bg-white/[0.01] border-b border-white/5">
              🤝 Trading Partners ({user?.role === 'buyer' ? 'Sellers' : 'Buyers'})
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingPartners ? (
                <div className="p-4 text-center text-eco-700 text-xs">Loading partners...</div>
              ) : partners.length === 0 ? (
                <div className="p-4 text-center text-eco-700 text-xs">No partners from transaction history</div>
              ) : (
                partners.map(p => {
                  const isConvoExists = conversations.some(c => c.user._id === p._id);
                  return (
                    <button
                      key={p._id}
                      onClick={() => handleSelectUser(p)}
                      className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3 ${activeUser?._id === p._id ? 'bg-white/10' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-eco-600/20 flex-shrink-0 flex items-center justify-center font-bold text-eco-400 text-xs">
                        {p.name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-eco-100 text-sm truncate block">{p.companyName || p.name}</span>
                        <span className="text-[10px] text-eco-700 block capitalize">{p.industryType || p.role}</span>
                      </div>
                      {!isConvoExists && (
                        <span className="text-[9px] bg-eco-500/10 text-eco-400 px-2 py-0.5 rounded border border-eco-500/20 font-semibold shrink-0">New Chat</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Chat Area — full width on mobile when showChat=true */}
        <div className={`${showChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-dark-500 relative w-full`}>
          {activeUser ? (
            <>
              {/* Chat Header — with mobile back button */}
              <div className="p-3 md:p-4 border-b border-white/10 flex items-center gap-3 bg-dark-400/50 backdrop-blur-md">
                <button
                  className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-eco-400 transition-colors"
                  onClick={() => setShowChat(false)}
                  aria-label="Back to contacts"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-eco-600/20 flex items-center justify-center font-bold text-eco-400">
                  {activeUser.name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-eco-100 text-sm md:text-base">{activeUser.companyName || activeUser.name}</h3>
                  {activeUser.role && <p className="text-[10px] text-eco-700 capitalize">{activeUser.role}</p>}
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => {
                  const isMine = getSenderId(msg) === user._id;
                  const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx-1].createdAt) > 5 * 60000;
                  
                  return (
                    <div key={msg._id || idx}>
                      {showTime && (
                        <div className="text-center text-[10px] text-eco-700 my-4 uppercase tracking-wider">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-3 md:px-4 py-2 text-sm ${isMine ? 'bg-eco-600 text-white rounded-br-sm' : 'bg-white/10 text-eco-100 rounded-bl-sm'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 md:p-4 bg-dark-400 border-t border-white/10">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-dark-500 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eco-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-eco-500 hover:bg-eco-400 disabled:opacity-50 disabled:hover:bg-eco-500 text-dark-500 rounded-xl px-4 flex items-center justify-center transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-eco-700">
              <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MessagesPage;
