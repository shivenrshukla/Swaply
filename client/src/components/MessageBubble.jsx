// src/components/MessageBubble.jsx
const MessageBubble = ({ message, isSender, showAvatar = false, otherUser = null }) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp || Date.now())
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Get message text from either field
  const messageText = message.text || message.content || ''

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} px-2`}>
      {/* Avatar for received messages */}
      {!isSender && showAvatar && otherUser && (
        <img
          src={otherUser.avatar || otherUser.profilePhoto || `https://placehold.co/32x32/1e293b/e2e8f0?text=${otherUser.name?.charAt(0) || '?'}`}
          alt={otherUser.name}
          className="w-8 h-8 rounded-full mr-2 mt-auto"
        />
      )}
      
      <div
        className={`px-4 py-2 rounded-2xl text-sm max-w-xs sm:max-w-sm md:max-w-md break-words relative
          ${isSender
            ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-br-none'
            : 'bg-gray-800 text-gray-200 rounded-bl-none border border-slate-700'
          } shadow-md transition-all duration-200 hover:shadow-lg`}
      >
        {/* Message status indicator for sent messages */}
        {isSender && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        )}
        
        <div className="whitespace-pre-wrap">{messageText}</div>
        
        <div className="text-[10px] text-right mt-1 opacity-70 font-mono">
          {formatTimestamp(message.timestamp || message.createdAt)}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
