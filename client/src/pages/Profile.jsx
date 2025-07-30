import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Profile = () => {
  const { user, token, setUser, loading } = useAuth()
  const [currentUser, setCurrentUser] = useState(user)

  // Profile edit form state
  const [profileFormData, setProfileFormData] = useState({
    name: currentUser?.name || '',
    location: currentUser?.location || '',
    availability: currentUser?.availability || 'Available',
    isPublic: currentUser?.isPublic ?? true
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Skill form state
  const [skillFormData, setSkillFormData] = useState({
    name: '',
    description: '',
    level: 'Beginner',
  })
  
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [offeredSkills, setOfferedSkills] = useState(currentUser?.skillsOffered || [])

  // Update form data when user data changes
  useEffect(() => {
    if (currentUser) {
      setProfileFormData({
        name: currentUser.name || '',
        location: currentUser.location || '',
        availability: currentUser.availability || 'Available',
        isPublic: currentUser.isPublic ?? true
      })
      setOfferedSkills(currentUser.skillsOffered || [])
    }
  }, [currentUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-200">
        <p className="text-lg animate-pulse">Loading...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-200">
        <p className="text-lg animate-pulse">You must be logged in to view this page.</p>
      </div>
    )
  }

  const handleProfileChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setProfileFormData({ ...profileFormData, [e.target.name]: value })
    setErrors({})
    setSuccess('')
  }

  const handleSkillChange = (e) => {
    setSkillFormData({ ...skillFormData, [e.target.name]: e.target.value })
    setErrors({})
    setSuccess('')
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.put(
        'http://localhost:8001/api/users/profile',
        profileFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess('Profile updated successfully!')
      
      // Update both local state and context
      const updatedUser = res.data.user
      setCurrentUser(updatedUser)
      
      if (setUser) {
        setUser(updatedUser)
      }
      
      // Always exit edit mode
      setIsEditingProfile(false)
      
      // Clear any previous errors
      setErrors({})
      
    } catch (err) {
      const msg = err.response?.data?.errors || err.response?.data?.message
      setErrors(typeof msg === 'string' ? { global: msg } : msg.reduce((acc, cur) => {
        acc[cur.param] = cur.msg
        return acc
      }, {}))
    }
  }

  const handleSkillSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(
        'http://localhost:8001/api/users/skills/offered',
        skillFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess(res.data.message)
      setOfferedSkills(prev => [...prev, {
        ...skillFormData,
        approved: false,
      }])
      setSkillFormData({ name: '', description: '', level: 'Beginner' })
    } catch (err) {
      const msg = err.response?.data?.errors || err.response?.data?.message
      setErrors(typeof msg === 'string' ? { global: msg } : msg.reduce((acc, cur) => {
        acc[cur.param] = cur.msg
        return acc
      }, {}))
    }
  }

  const cancelEdit = () => {
    setIsEditingProfile(false)
    setProfileFormData({
      name: currentUser?.name || '',
      location: currentUser?.location || '',
      availability: currentUser?.availability || 'Available',
      isPublic: currentUser?.isPublic ?? true
    })
    setErrors({})
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-100 py-20 px-4">
      <div className="max-w-3xl mx-auto bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-blue-500/30">
        <h1 className="text-4xl font-bold text-blue-300 mb-8 animate-subtleTilt">👤 My Profile</h1>

        {success && <p className="text-green-400 mb-4">{success}</p>}
        {errors.global && <p className="text-red-400 mb-4">{errors.global}</p>}

        {/* Profile Information Section */}
        <div className="space-y-6 text-gray-200 mb-12">
          {!isEditingProfile ? (
            <>
              <div>
                <h2 className="text-lg font-semibold text-blue-400">Name:</h2>
                <p className="text-base">{currentUser.name}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-400">Email:</h2>
                <p className="text-base">{currentUser.email}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-400">Location:</h2>
                <p className="text-base">{currentUser.location}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-400">Availability:</h2>
                <p className="text-base">{currentUser.availability}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-400">Profile Visibility:</h2>
                <p className="text-base">{currentUser.isPublic ? 'Public' : 'Private'}</p>
              </div>
              
              <button
                onClick={() => setIsEditingProfile(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
              >
                ✏️ Edit Profile
              </button>
            </>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileFormData.name}
                  onChange={handleProfileChange}
                  className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={profileFormData.location}
                  onChange={handleProfileChange}
                  className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500"
                />
                {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Availability</label>
                <select
                  name="availability"
                  value={profileFormData.availability}
                  onChange={handleProfileChange}
                  className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
                {errors.availability && <p className="text-red-400 text-sm mt-1">{errors.availability}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={profileFormData.isPublic}
                  onChange={handleProfileChange}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-300">Make profile public</label>
                {errors.isPublic && <p className="text-red-400 text-sm mt-1">{errors.isPublic}</p>}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
                >
                  💾 Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          )}

          <div>
            <h2 className="text-lg font-semibold text-green-400 mt-8">🧠 Skills Offered:</h2>
            {offeredSkills.length > 0 ? (
              <ul className="list-disc list-inside mt-2 space-y-1">
                {offeredSkills.map((skill, idx) => (
                  <li key={idx} className="text-sm text-gray-300">
                    <span className="text-cyan-300 font-medium">{skill.name}</span> — {skill.level}
                    {skill.approved === false && (
                      <span className="ml-2 text-yellow-400 text-xs">(Pending approval)</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 mt-2">No skills added yet.</p>
            )}
          </div>
        </div>

        {/* Add Skill Form */}
        <div className="mt-10 border-t border-blue-700 pt-6">
          <h2 className="text-2xl font-semibold text-blue-300 mb-4">➕ Add a Skill</h2>

          <form onSubmit={handleSkillSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Skill Name</label>
              <input
                type="text"
                name="name"
                value={skillFormData.name}
                onChange={handleSkillChange}
                className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Description</label>
              <textarea
                name="description"
                value={skillFormData.description}
                onChange={handleSkillChange}
                className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Skill Level</label>
              <select
                name="level"
                value={skillFormData.level}
                onChange={handleSkillChange}
                className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
              {errors.level && <p className="text-red-400 text-sm mt-1">{errors.level}</p>}
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition"
            >
              Add Skill
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes subtleTilt {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
          50% { transform: rotateX(2deg) rotateY(2deg); }
        }
        .animate-subtleTilt {
          animation: subtleTilt 10s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  )
}

export default Profile;