import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { useNavigation } from '../context/NavigationContext';

const Chat = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [room] = useState('general');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join', {
        username: user.name,
        userId: user._id || user.id,
        room: room
      });
    });

    newSocket.on('previousMessages', (msgs) => {
      setMessages(msgs);
    });

    newSocket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('userJoined', (data) => {
      setMessages(prev => [...prev, {
        system: true,
        message: data.message,
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('userLeft', (data) => {
      setMessages(prev => [...prev, {
        system: true,
        message: data.message,
        timestamp: data.timestamp
      }]);
    });

    newSocket.on('activeUsers', (users) => {
      setActiveUsers(users);
    });

    newSocket.on('userTyping', (username) => {
      setTypingUsers(prev => new Set([...prev, username]));
    });

    newSocket.on('userStoppedTyping', (username) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    });

    return () => {
      newSocket.emit('leave_room');
      newSocket.disconnect();
    };
  }, [user, room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('sendMessage', { message: message.trim() });
      setMessage('');
      socket.emit('stopTyping');
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (socket) {
      socket.emit('typing');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping');
      }, 1000);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
            <h2 className="text-2xl font-bold text-white">Chat Room - {room}</h2>
          </div>

          <div className="flex h-[600px]">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
                {messages.map((msg, index) => (
                  <div key={index}>
                    {msg.system ? (
                      <div className="text-center text-gray-400 text-sm italic">
                        {msg.message}
                      </div>
                    ) : (
                      <div className={`flex ${msg.userId === user._id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                          msg.userId === user._id 
                            ? 'bg-blue-600' 
                            : 'bg-gray-700'
                        } rounded-lg p-3`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">
                              {msg.username}
                            </span>
                            <span className="text-xs text-gray-300">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-white break-words">{msg.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="px-4 py-2 bg-gray-800 text-gray-400 text-sm">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>

            {/* Active Users Sidebar */}
            <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
              <h3 className="text-white font-semibold mb-4">Active Users ({activeUsers.length})</h3>
              <div className="space-y-2">
                {activeUsers.map((u, index) => (
                  <div key={index} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className={u.userId === user._id ? 'font-semibold text-blue-400' : ''}>
                        {u.username} {u.userId === user._id && '(You)'}
                      </span>
                    </div>
                    {u.userId !== user._id && (
                      <button
                        onClick={() => navigate('direct-messages', { _id: u.userId, name: u.username })}
                        className="text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                        title={`Message ${u.username}`}
                      >
                        💬
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;