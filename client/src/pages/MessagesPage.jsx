import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { messageService } from '../services';
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
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    messageService.getConversations()
      .then(({ data }) => {
        setConversations(data.conversations);
        if (initialUser) {
          const existing = data.conversations.find(c => c.user._id === initialUser);
          if (existing) setActiveUser(existing.user);
          else setActiveUser({ _id: initialUser, name: 'Loading user...' }); // Needs user fetch if not in convos
        } else if (data.conversations.length > 0) {
          setActiveUser(data.conversations[0].user);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingConvos(false));
  }, [initialUser]);

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
      socket.emit('joinUser', user._id);
      
      socket.on('receiveMessage', (msg) => {
        // Update messages if it's the active conversation
        if (activeUser && (msg.sender._id === activeUser._id || msg.receiver._id === activeUser._id)) {
          setMessages(prev => {
            if (prev.find(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        }

        // Update conversation list
        setConversations(prev => {
          const isFromActive = activeUser && msg.sender._id === activeUser._id;
          const otherUserId = msg.sender._id === user._id ? msg.receiver._id : msg.sender._id;
          const otherUser = msg.sender._id === user._id ? msg.receiver : msg.sender;
          
          const existingIdx = prev.findIndex(c => c.user._id === otherUserId);
          if (existingIdx > -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              user: otherUser,
              lastMessage: msg,
              unreadCount: (!isFromActive && msg.sender._id !== user._id) ? prev[existingIdx].unreadCount + 1 : 0
            };
            return updated.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
          } else {
            return [{ user: otherUser, lastMessage: msg, unreadCount: (!isFromActive && msg.sender._id !== user._id) ? 1 : 0 }, ...prev];
          }
        });
      });

      return () => socket.off('receiveMessage');
    }
  }, [socket, user, activeUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;

    try {
      // Optimistic update handled by socket
      await messageService.sendMessage(activeUser._id, newMessage);
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 flex justify-center">
      <div className="max-w-6xl w-full flex h-[80vh] glass-card overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-white/10 flex flex-col bg-dark-400">
          <div className="p-4 border-b border-white/10 font-display font-bold text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-eco-500" /> Inbox
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingConvos ? (
              <div className="p-8 text-center text-eco-700">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-eco-700">No conversations yet</div>
            ) : (
              conversations.map(c => (
                <button
                  key={c.user._id}
                  onClick={() => setActiveUser(c.user)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-start gap-3 ${activeUser?._id === c.user._id ? 'bg-white/10' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-eco-600/20 flex-shrink-0 flex items-center justify-center font-bold text-eco-400">
                    {c.user.name?.[0]}
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
                      {c.lastMessage?.sender === user._id ? 'You: ' : ''}{c.lastMessage?.text}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-dark-500 relative">
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-dark-400/50 backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-eco-600/20 flex items-center justify-center font-bold text-eco-400">
                  {activeUser.name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-eco-100">{activeUser.companyName || activeUser.name}</h3>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => {
                  const isMine = msg.sender === user._id || msg.sender._id === user._id;
                  const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx-1].createdAt) > 5 * 60000;
                  
                  return (
                    <div key={msg._id || idx}>
                      {showTime && (
                        <div className="text-center text-[10px] text-eco-700 my-4 uppercase tracking-wider">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-eco-600 text-white rounded-br-sm' : 'bg-white/10 text-eco-100 rounded-bl-sm'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-dark-400 border-t border-white/10">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-dark-500 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-eco-500 transition-colors"
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
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MessagesPage;
