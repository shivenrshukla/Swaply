// src/components/ChatWindow.jsx
import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'

const ChatWindow = ({ messages, onSendMessage, currentUser, otherUser }) => {
  const [newMessage, setNewMessage] = useState('')
  const bottomRef = useRef(null)

  const handleSend = () => {
    if (!newMessage.trim()) return
    onSendMessage(newMessage.trim())
    setNewMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend()
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-900 to-gray-950 text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl h-[80vh] bg-slate-900 bg-opacity-60 backdrop-blur-lg rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-700">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white px-6 py-4 text-lg font-semibold shadow-sm tracking-wide">
          Chat with {otherUser?.name || 'User'}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {messages?.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              isSender={msg.sender === currentUser._id}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-700 p-4 bg-slate-800 flex items-center space-x-3">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2 rounded-full bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <button
            onClick={handleSend}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-5 py-2 rounded-full transition duration-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
