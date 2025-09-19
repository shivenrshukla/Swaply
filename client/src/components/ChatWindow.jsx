// src/components/ChatWindow.jsx
import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'

const ChatWindow = ({ currentUser, otherUser, messages, onSendMessage }) => {
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageText.trim()) return
    
    onSendMessage(messageText)
    setMessageText('')
  }

  // Helper function to check if current user is sender
  const isCurrentUserSender = (message) => {
    const senderId = message.sender?._id || message.sender
    const currentUserId = currentUser?._id || currentUser?.id
    
    // Convert both to strings for comparison
    return String(senderId) === String(currentUserId)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <img
            src={otherUser.avatar || otherUser.profilePhoto || `https://placehold.co/40x40/1e293b/e2e8f0?text=${otherUser.name?.charAt(0) || '?'}`}
            alt={otherUser.name}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <h3 className="font-semibold text-lg">{otherUser.name}</h3>
            <p className="text-sm text-blue-100">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">👋</div>
                <p>Start the conversation!</p>
                <p className="text-sm">Say hello to {otherUser.name}</p>
              </div>
            </div>
          ) : (
            Array.isArray(messages) && messages.map((message, index) => {
              // Validate message data before rendering
              if (!message) {
                console.warn('Skipping invalid message at index:', index)
                return null
              }
              
              const messageText = message.text || message.content
              if (!messageText) {
                console.warn('Skipping message without text:', message)
                return null
              }
              
              // Debug logging (remove after fixing)
              console.log('Rendering message:', {
                id: message._id,
                sender: message.sender,
                text: messageText,
                isSender: isCurrentUserSender(message)
              })
              
              try {
                return (
                  <MessageBubble
                    key={message._id || `msg-${index}`}
                    message={{
                      ...message,
                      text: messageText
                    }}
                    isSender={isCurrentUserSender(message)}
                    otherUser={otherUser}
                  />
                )
              } catch (error) {
                console.error('Error rendering message:', error, message)
                return (
                  <div key={`error-${index}`} className="text-red-500 text-sm p-2">
                    Error displaying message
                  </div>
                )
              }
            }).filter(Boolean) // Remove null entries
          )}
        </div>
        {/* Auto-scroll reference */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Message ${otherUser.name}...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            autoFocus
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2"
          >
            <span>Send</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatWindow