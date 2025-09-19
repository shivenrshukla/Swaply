import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const SwapRequestModal = ({ isOpen, onClose, targetUser, onSubmit }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    skillToOffer: '',
    skillToRequest: '',
    message: '',
    duration: '',
    schedule: ''
  })
  const [loading, setLoading] = useState(false)
  const [showOfferSkillInput, setShowOfferSkillInput] = useState(false)
  const [showRequestSkillInput, setShowRequestSkillInput] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const mockUserSkills = [
    'React', 'Node.js', 'MongoDB', 'JavaScript', 'Python',
    'TypeScript', 'Data Science', 'UI/UX Design', 'Cloud Computing', 'Mobile Development'
  ]

  const showAlert = (message) => {
    setErrorMessage(message)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.skillToOffer || !formData.skillToRequest || !formData.message || !formData.duration || !formData.schedule) {
      showAlert('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      // Fixed: Send data in the format expected by backend
      const requestData = {
        recipientId: targetUser._id,
        skillToOffer: formData.skillToOffer,  // Changed from { skillName: formData.skillToOffer }
        skillToRequest: formData.skillToRequest,  // Changed from { skillName: formData.skillToRequest }
        message: formData.message,
        proposedDuration: formData.duration,
        proposedSchedule: formData.schedule
      }

      console.log('Submitting request data:', requestData)

      await onSubmit(requestData)

      setFormData({
        skillToOffer: '',
        skillToRequest: '',
        message: '',
        duration: '',
        schedule: ''
      })
      onClose()
    } catch (err) {
      console.error('Error submitting request:', err)
      showAlert('Failed to send request. Please check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'skillToOffer' && value === 'other') {
      setShowOfferSkillInput(true)
      setFormData(prev => ({ ...prev, skillToOffer: '' }))
    } else if (name === 'skillToRequest' && value === 'other') {
      setShowRequestSkillInput(true)
      setFormData(prev => ({ ...prev, skillToRequest: '' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  if (!isOpen || !targetUser) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-blue-gray-900 border border-blue-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img
                src={targetUser.avatar || `https://placehold.co/48x48/1e293b/e2e8f0?text=${targetUser.name.charAt(0)}`}
                alt={targetUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/48x48/1e293b/e2e8f0?text=${targetUser.name.charAt(0)}`; }}
              />
              <div>
                <h2 className="text-2xl font-bold text-cyan-300">Request Skill Swap</h2>
                <p className="text-blue-200">with {targetUser.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors duration-200 text-2xl">×</button>
          </div>

          {errorMessage && (
            <div className="bg-red-700 bg-opacity-75 px-5 py-3 rounded mb-6 text-sm font-semibold text-red-100 shadow-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Offer Skill */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Skill You'll Teach</label>
              <div className="flex items-center gap-2">
                {!showOfferSkillInput ? (
                  <select
                    name="skillToOffer"
                    value={formData.skillToOffer}
                    onChange={handleInputChange}
                    className="flex-grow bg-gray-700 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!showOfferSkillInput}
                  >
                    <option value="">Select a skill to offer</option>
                    {mockUserSkills.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                    <option value="other">Other (type your own)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    name="skillToOffer"
                    value={formData.skillToOffer}
                    onChange={handleInputChange}
                    placeholder="Type your skill to offer"
                    className="flex-grow bg-gray-700 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={showOfferSkillInput}
                    list="offerSkills"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferSkillInput(!showOfferSkillInput)
                    setFormData(prev => ({ ...prev, skillToOffer: '' }))
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-sm"
                >
                  {showOfferSkillInput ? 'List' : 'Type'}
                </button>
              </div>
              <datalist id="offerSkills">
                {mockUserSkills.map((skill) => (
                  <option key={skill} value={skill} />
                ))}
              </datalist>
            </div>

            {/* Request Skill */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Skill You Want to Learn</label>
              <div className="flex items-center gap-2">
                {!showRequestSkillInput ? (
                  <select
                    name="skillToRequest"
                    value={formData.skillToRequest}
                    onChange={handleInputChange}
                    className="flex-grow bg-gray-700 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!showRequestSkillInput}
                  >
                    <option value="">Select a skill to learn</option>
                    {mockUserSkills.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                    <option value="other">Other (type your own)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    name="skillToRequest"
                    value={formData.skillToRequest}
                    onChange={handleInputChange}
                    placeholder="Type your skill to learn"
                    className="flex-grow bg-gray-700 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={showRequestSkillInput}
                    list="requestSkills"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestSkillInput(!showRequestSkillInput)
                    setFormData(prev => ({ ...prev, skillToRequest: '' }))
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-sm"
                >
                  {showRequestSkillInput ? 'List' : 'Type'}
                </button>
              </div>
              <datalist id="requestSkills">
                {mockUserSkills.map((skill) => (
                  <option key={skill} value={skill} />
                ))}
              </datalist>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Proposed Duration</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select duration</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="3 weeks">3 weeks</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="3 months">3 months</option>
              </select>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Proposed Schedule</label>
              <select
                name="schedule"
                value={formData.schedule}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select schedule</option>
                <option value="Weekdays morning">Weekdays morning</option>
                <option value="Weekdays afternoon">Weekdays afternoon</option>
                <option value="Weekdays evening">Weekdays evening</option>
                <option value="Weekends morning">Weekends morning</option>
                <option value="Weekends afternoon">Weekends afternoon</option>
                <option value="Weekends evening">Weekends evening</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Personal Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-gray-700 border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell them about your experience and why you'd like to learn from them..."
                required
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">{formData.message.length}/500 characters</p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SwapRequestModal