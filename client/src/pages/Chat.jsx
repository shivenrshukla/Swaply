import { useEffect, useState } from 'react'
import chatService from '../services/chatService'
import swapService from '../services/swapService'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useNavigation } from '../context/NavigationContext'
import ChatWindow from '../components/ChatWindow'
import ErrorBoundary from '../components/ErrorBoundary'

const Chat = () => {
  const { user } = useAuth()
  const socket = useSocket()
  const { pageParams } = useNavigation()

  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [matches, setMatches] = useState([]) // Add this for available matches
  const [showNewChatModal, setShowNewChatModal] = useState(false) // Modal state

  // Load conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await chatService.getMyChats()
        const chatList = Array.isArray(res.data) ? res.data : res.data.conversations || []
        setConversations(chatList)
      } catch (err) {
        console.error('❌ Error fetching chats:', err)
        setConversations([])
      }
    }
    fetchConversations()
  }, [])

  // Load available matches for starting new chats
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await swapService.getMatches('active')
        const matchesArray = response.matches || []
        setMatches(matchesArray)
      } catch (err) {
        console.error('❌ Error fetching matches:', err)
      }
    }
    fetchMatches()
  }, [])

  // Auto-open chat if matchId is passed via pageParams or localStorage
  useEffect(() => {
    if (!conversations.length) return

    const matchId = pageParams?.matchId || localStorage.getItem("activeChatMatchId")
    
    if (!matchId) return

    const conv = conversations.find((c) => c._id === matchId)
    if (conv) {
      const other = conv.participants?.find((p) => p._id !== user._id)
      if (other) {
        openChat(other)
        localStorage.removeItem("activeChatMatchId")
      }
    } else {
      // Try to create conversation from match
      createConversationFromMatch(matchId)
    }
  }, [pageParams, conversations, user])

  // Listen for incoming socket messages
  useEffect(() => {
    if (!socket) return

    const handleReceiveMessage = (msg) => {
    // Correctly compare the sender's ID from the populated object
      if (msg.sender?._id === selectedUser?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('receive_message', handleReceiveMessage)
    return () => socket.off('receive_message', handleReceiveMessage)
  }, [socket, selectedUser])

  const openChat = async (otherUser) => {
    setSelectedUser(otherUser)
    try {
      const res = await chatService.getMessagesWith(otherUser._id)
      setMessages(res.data || [])
    } catch (err) {
      console.error('❌ Error loading chat:', err)
      setMessages([])
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const msg = { sender: user._id, recipient: selectedUser._id, text }

    try {
      const res = await chatService.sendMessage(msg)
      setMessages((prev) => [...prev, res.data])
      socket.emit('send_message', res.data)
    } catch (err) {
      console.error('❌ Message send failed:', err)
    }
  }

  // Create conversation from match
  const createConversationFromMatch = async (matchId) => {
    try {
      const match = matches.find(m => m._id === matchId)
      if (!match) {
        console.warn('⚠️ Match not found:', matchId)
        return
      }

      const otherParticipant = match.participants?.find(p => p.user?._id !== user._id)
      if (otherParticipant) {
        await startChatWithUser(otherParticipant.user)
        localStorage.removeItem("activeChatMatchId")
      }
    } catch (err) {
      console.error('❌ Error creating conversation from match:', err)
    }
  }

  // Start chat with a specific user
  const startChatWithUser = async (otherUser) => {
    try {
      // Try to create/get conversation
      await chatService.createOrGetConversation?.(otherUser._id)
      
      // Refresh conversations
      const updatedChats = await chatService.getMyChats()
      const chatList = Array.isArray(updatedChats.data) ? updatedChats.data : updatedChats.data.conversations || []
      setConversations(chatList)
      
      // Open the chat
      openChat(otherUser)
      setShowNewChatModal(false)
    } catch (err) {
      console.error('❌ Error starting chat:', err)
      // If API doesn't exist, just open chat directly
      openChat(otherUser)
      setShowNewChatModal(false)
    }
  }

  // Get users from matches who don't have active conversations
  const getAvailableUsersForChat = () => {
    const existingChatUsers = conversations.map(conv => 
      conv.participants?.find(p => p._id !== user._id)?._id
    ).filter(Boolean)

    return matches
      .map(match => match.participants?.find(p => p.user?._id !== user._id)?.user)
      .filter(matchUser => matchUser && !existingChatUsers.includes(matchUser._id))
  }

  const availableUsers = getAvailableUsersForChat()

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-700 bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-blue-300 animate-subtleTilt">💬 Conversations</h2>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            + New Chat
          </button>
        </div>

        {/* New Chat Modal */}
        {showNewChatModal && (
          <div className="mb-6 p-4 bg-gray-800/80 rounded-lg border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-cyan-300">Start New Chat</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-3">Chat with your matched partners:</p>
            
            {availableUsers.length > 0 ? (
              <div className="max-h-48 overflow-y-auto">
                {availableUsers.map(matchUser => (
                  <div
                    key={matchUser._id}
                    onClick={() => startChatWithUser(matchUser)}
                    className="p-3 mb-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-colors duration-200 flex items-center gap-3"
                  >
                    <img
                      src={matchUser.avatar || `https://placehold.co/32x32/1e293b/e2e8f0?text=${matchUser.name?.charAt(0) || '?'}`}
                      alt={matchUser.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-white">{matchUser.name}</p>
                      <p className="text-xs text-gray-400">Start chatting</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No new matches available to chat with.</p>
            )}
          </div>
        )}

        {/* Existing Conversations */}
        {conversations.length > 0 ? (
          conversations.map((conv) => {
            const other = conv.participants?.find((p) => p._id !== user._id)
            if (!other) return null
            return (
              <div
                key={conv._id}
                onClick={() => openChat(other)}
                className={`p-4 mb-3 rounded-lg cursor-pointer transition-all duration-300 ${
                  selectedUser?._id === other._id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={other.avatar || `https://placehold.co/40x40/1e293b/e2e8f0?text=${other.name?.charAt(0) || '?'}`}
                    alt={other.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{other.name}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {conv.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-400">No conversations yet</p>
            <p className="text-sm text-gray-500">Click "New Chat" to start!</p>
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div className="w-2/3 bg-white h-full">
        {selectedUser ? (
          <ErrorBoundary>
            <ChatWindow
              currentUser={user}
              otherUser={selectedUser}
              messages={messages}
              onSendMessage={sendMessage}
            />
          </ErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl mb-2">Select a conversation to start chatting</p>
              <p className="text-sm">Or click "New Chat" to start a conversation with a match</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes subtleTilt {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
          50% { transform: rotateX(2deg) rotateY(2deg); }
        }
        .animate-subtleTilt {
          animation: subtleTilt 12s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  )
}

export default Chat


