import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import userService from '../services/userService'
import swapService from '../services/swapService'
import { useAuth } from '../context/AuthContext'
import SwapRequestModal from '../components/SwapRequestModal'

const UserDetails = () => {
  const { id } = useParams()
  const { user: currentUser } = useAuth()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await userService.getUserById(id)
        setUser(res.data)
      } catch (err) {
        console.error('Failed to fetch user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  const handleSwapSubmit = async ({ recipientId, message }) => {
    try {
      await swapService.sendRequest({ recipientId, message })
      alert('Swap request sent!')
      setModalOpen(false)
    } catch (err) {
      console.error('Swap request error:', err)
      alert('Failed to send swap request.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black text-blue-300">
        Loading user...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black text-red-400">
        User not found.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white py-20 px-4">
      <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-lg border border-blue-400/30 rounded-xl shadow-2xl p-8">
        <div className="flex items-center gap-6">
          <img
            src={user.avatar || '/default-avatar.png'}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md"
          />
          <div>
            <h1 className="text-3xl font-extrabold text-blue-300">{user.name}</h1>
            <p className="text-sm text-blue-200">{user.email}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-blue-400 mb-2">Skills</h2>
          <ul className="list-disc list-inside text-sm text-blue-100">
            {user.skills?.length > 0 ? (
              user.skills.map((skill, idx) => <li key={idx}>{skill}</li>)
            ) : (
              <li>No skills listed.</li>
            )}
          </ul>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-blue-400 mb-2">About</h2>
          <p className="text-sm text-blue-100">{user.bio || 'No bio available.'}</p>
        </div>

        {currentUser && currentUser._id !== user._id && (
          <div className="mt-8">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 transition px-5 py-2 rounded text-sm font-semibold text-white shadow-md"
            >
              Request Skill Swap
            </button>
          </div>
        )}
      </div>

      <SwapRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        targetUser={user}
        onSubmit={handleSwapSubmit}
      />
    </div>
  )
}

export default UserDetails
