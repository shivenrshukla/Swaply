const MessageBubble = ({ message, isSender }) => {
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} px-2`}>
      <div
        className={`px-4 py-2 rounded-2xl text-sm max-w-xs sm:max-w-sm md:max-w-md break-words relative
          ${isSender
            ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-br-none'
            : 'bg-gray-800 text-gray-200 rounded-bl-none border border-slate-700'
          } shadow-md`}
      >
        <div>{message.text}</div>
        <div className="text-[10px] text-right mt-1 opacity-70 font-mono">
          {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
