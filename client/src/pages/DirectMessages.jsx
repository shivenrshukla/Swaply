import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import io from 'socket.io-client';
import axios from 'axios';

const DirectMessages = () => {
  const { user } = useAuth();
  const { pageParams } = useNavigation();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null); // { _id, name }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const sock = io(API_URL);
    setSocket(sock);

    sock.on('connect', () => {
      sock.emit('add_user', user._id || user.id);
    });

    sock.on('receive_message', (msg) => {
      const isForMe = msg.recipient === user._id || msg.recipient?._id === user._id;
  
      if (!isForMe) return;
      setSelectedConv(prev => {
        if (prev && (msg.sender === prev._id || msg.sender?._id === prev._id)) {
          setMessages(prevMsgs => [...prevMsgs, msg]);
          markAsRead(msg._id);
        }
        return prev;
      });
      loadConversations(); // refresh sidebar unread counts
    });

    sock.on('user_online', (id) => setOnlineUsers(prev => new Set([...prev, id])));
    sock.on('user_offline', (id) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(id); return s; }));

    loadConversations();
    
    // Auto-select conversation if passed via navigation params
    if (pageParams && (pageParams._id || pageParams.id)) {
      setSelectedConv({
        _id: pageParams._id || pageParams.id,
        name: pageParams.name || 'User'
      });
    }

    return () => sock.disconnect();
  }, [user._id, pageParams]);

  // ── Scroll to bottom on new message ──────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load a conversation when user is selected ─────────────────────────────
  useEffect(() => {
    if (selectedConv) loadMessages(selectedConv._id);
  }, [selectedConv]);

  // ── API helpers ────────────────────────────────────────────────────────────
  const loadConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages/conversations`, { headers: authHeaders });
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const res = await axios.get(`${API_URL}/api/messages/conversation/${userId}`, { headers: authHeaders });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.patch(`${API_URL}/api/messages/${messageId}/read`, {}, { headers: authHeaders });
    } catch { /* silent */ }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);

    try {
      const res = await axios.post(`${API_URL}/api/messages`, {
        recipient: selectedConv._id,
        title: 'Direct Message',
        content: newMessage.trim()
      }, { headers: authHeaders });

      const sent = res.data.data || res.data;

      // Optimistically add to local chat
      setMessages(prev => [...prev, {
        ...sent,
        sender: { _id: user._id, name: user.name },
        createdAt: sent.createdAt || new Date().toISOString()
      }]);

      // Emit via socket so recipient gets it in real-time
      if (socket) {
        socket.emit('send_message', {
          ...sent,
          sender: user._id,
          recipient: selectedConv._id
        });
      }

      setNewMessage('');
      loadConversations(); // update sidebar last message
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    try {
      const res = await axios.get(`${API_URL}/api/users/search?q=${q}`, { headers: authHeaders });
      setSearchResults((res.data.users || res.data || []).filter(u => u._id !== user._id));
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const startConversation = (u) => {
    setSelectedConv({ _id: u._id, name: u.name });
    setSearchQuery('');
    setSearchResults([]);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts) => {
    const d = new Date(ts), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const isMine = (msg) => {
    const sid = msg.sender?._id || msg.sender;
    return sid === user._id || sid?.toString() === user._id?.toString();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-blue-700/30">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-4">
            <h2 className="text-2xl font-bold text-white">💬 Direct Messages</h2>
          </div>

          <div className="flex h-[640px]">
            {/* ── Sidebar ── */}
            <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
              {/* Search */}
              <div className="p-3 border-b border-gray-700">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users to message…"
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-gray-700 rounded-xl max-h-48 overflow-y-auto shadow-lg">
                    {searchResults.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => startConversation(u)}
                        className="p-3 hover:bg-gray-600 cursor-pointer flex items-center gap-3 rounded-xl"
                      >
                        <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{u.name}</p>
                          <p className="text-gray-400 text-xs">{u.location || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm mt-8">
                    <p>No conversations yet.</p>
                    <p className="mt-1">Search for a user above to start chatting.</p>
                  </div>
                ) : conversations.map((conv) => (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-4 border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/60 transition-colors ${
                      selectedConv?._id === conv._id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {conv.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        {onlineUsers.has(conv._id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-white font-semibold truncate">{conv.name}</span>
                          <span className="text-xs text-gray-400 ml-1 shrink-0">
                            {conv.lastMessageTime && formatTime(conv.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
                      </div>
                      {conv.unread && (
                        <div className="w-2.5 h-2.5 bg-blue-400 rounded-full shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Chat area ── */}
            <div className="flex-1 flex flex-col bg-gray-900">
              {selectedConv ? (
                <>
                  {/* Header */}
                  <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedConv.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      {onlineUsers.has(selectedConv._id) && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-800" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{selectedConv.name}</h3>
                      <p className="text-xs text-gray-400">
                        {onlineUsers.has(selectedConv._id) ? '🟢 Online' : '⚫ Offline'}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages.length === 0 && (
                      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        No messages yet. Say hello! 👋
                      </div>
                    )}
                    {messages.map((msg, i) => {
                      const mine = isMine(msg);
                      const showDate = i === 0 || formatDate(messages[i - 1].createdAt) !== formatDate(msg.createdAt);
                      return (
                        <div key={msg._id || i}>
                          {showDate && (
                            <div className="text-center text-gray-500 text-xs my-3">
                              {formatDate(msg.createdAt)}
                            </div>
                          )}
                          <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 shadow-md ${
                              mine
                                ? 'bg-blue-600 rounded-br-sm text-white'
                                : 'bg-gray-700 rounded-bl-sm text-gray-100'
                            }`}>
                              <p className="break-words text-sm">{msg.content}</p>
                              <span className={`text-xs mt-1 block ${mine ? 'text-blue-200 text-right' : 'text-gray-400'}`}>
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 border-t border-gray-700">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message…"
                        className="flex-1 bg-gray-700 text-white rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0"
                      >
                        ➤
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg font-medium text-gray-400">Select a conversation</p>
                  <p className="text-sm text-gray-500 mt-1">or search for a user to start a new chat</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;