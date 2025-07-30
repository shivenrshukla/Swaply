import { useState } from 'react'

const FeedbackForm = ({ isOpen, onClose, onSubmit, targetUser }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (rating < 1 || rating > 5 || !comment.trim()) return
    onSubmit({
      toUserId: targetUser._id,
      rating,
      comment: comment.trim(),
    })
    setRating(0)
    setComment('')
    onClose()
  }

  if (!isOpen || !targetUser) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-950 text-white rounded-xl shadow-2xl w-[90%] max-w-md p-6 border border-slate-700">
        <h2 className="text-2xl font-semibold mb-4 text-cyan-300 tracking-wide">
          Leave Feedback for {targetUser.name}
        </h2>

        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-300">Rating (1 to 5):</label>
          <select
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value={0}>Select</option>
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-300">Comment:</label>
          <textarea
            rows={4}
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your experience..."
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-500 text-sm px-4 py-2 rounded-md transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm px-4 py-2 rounded-md transition duration-200"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeedbackForm
