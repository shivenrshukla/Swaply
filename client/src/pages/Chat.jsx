// src/pages/Chat.jsx
import { useEffect, useState } from 'react'
import chatService from '../services/chatService'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import ChatWindow from '../components/ChatWindow'

const Chat = () => {
  const { user } = useAuth()
  const socket = useSocket()

  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await chatService.getMyChats()
        const chatList = Array.isArray(res.data) ? res.data : res.data.conversations || []
        setConversations(chatList)
      } catch (err) {
        console.error('Error fetching chats:', err)
        setConversations([])
      }
    }

    fetchConversations()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleReceiveMessage = (msg) => {
      if (msg.sender === selectedUser?._id) {
        setMessages((prev) => [...prev, msg])
      }
    }

    socket.on('receive_message', handleReceiveMessage)
    return () => socket.off('receive_message', handleReceiveMessage)
  }, [socket, selectedUser])

  const openChat = async (otherUser) => {
    setSelectedUser(otherUser)
    try {
      const res = await chatService.getMessagesWith(otherUser._id)
      setMessages(res.data || [])
    } catch (err) {
      console.error('Error loading chat:', err)
      setMessages([])
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const msg = {
      sender: user._id,
      recipient: selectedUser._id,
      text,
    }
    try {
      const res = await chatService.sendMessage(msg)
      setMessages((prev) => [...prev, res.data])
      socket.emit('send_message', res.data)
    } catch (err) {
      console.error('Message send failed:', err)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-700 bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <h2 className="text-2xl font-semibold text-blue-300 mb-6 animate-subtleTilt">💬 Conversations</h2>
        {conversations.map((conv) => {
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
              <p className="font-semibold">{other.name}</p>
              <p className="text-sm text-gray-400 truncate">{conv.lastMessage?.text || 'No messages yet'}</p>
            </div>
          )
        })}
      </div>

      {/* Chat Window */}
      <div className="w-2/3 bg-white h-full">
        {selectedUser ? (
          <ChatWindow
            currentUser={user}
            otherUser={selectedUser}
            messages={messages}
            onSendMessage={sendMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            Select a conversation to start chatting
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
