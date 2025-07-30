import { useEffect, useState } from 'react'
import userService from '../services/userService'
import swapService from '../services/swapService'

const AdminExport = () => {
  const [users, setUsers] = useState([])
  const [swaps, setSwaps] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res1 = await userService.getAllUsers()
        const res2 = await swapService.getAllSwaps()
        setUsers(res1.data)
        setSwaps(res2.data)
      } catch (err) {
        console.error('Export fetch error:', err)
      }
    }
    fetchData()
  }, [])

  const downloadCSV = (data, filename) => {
    const csv = convertToCSV(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const convertToCSV = (data) => {
    if (!data.length) return ''
    const headers = Object.keys(data[0])
    const rows = data.map(row =>
      headers.map(field => `"${row[field] || ''}"`).join(',')
    )
    return [headers.join(','), ...rows].join('\n')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 text-gray-100 px-6 py-16">
      <div className="max-w-4xl mx-auto bg-gradient-to-tr from-blue-700 to-blue-gray-800 shadow-2xl rounded-2xl p-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-cyan-300 animate-subtleTilt">
          📥 Admin Data Export
        </h1>

        <div className="space-y-6">
          <div className="bg-gray-900 bg-opacity-50 border border-blue-600 rounded-lg p-6 shadow-inner">
            <h2 className="text-xl font-semibold text-blue-200 mb-3">Export Users</h2>
            <button
              onClick={() => downloadCSV(users, 'users.csv')}
              className="bg-cyan-500 text-gray-900 font-semibold px-5 py-2 rounded hover:bg-cyan-600 transition text-sm"
            >
              📄 Download Users CSV
            </button>
          </div>

          <div className="bg-gray-900 bg-opacity-50 border border-green-600 rounded-lg p-6 shadow-inner">
            <h2 className="text-xl font-semibold text-green-200 mb-3">Export Swap Requests</h2>
            <button
              onClick={() => downloadCSV(swaps, 'swap_requests.csv')}
              className="bg-green-500 text-gray-900 font-semibold px-5 py-2 rounded hover:bg-green-600 transition text-sm"
            >
              🔄 Download Swaps CSV
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes subtleTilt {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
          50% { transform: rotateX(2deg) rotateY(2deg); }
        }
        .animate-subtleTilt {
          animation: subtleTilt 12s ease-in-out infinite;
          display: inline-block;
          transform-style: preserve-3d;
          perspective: 800px;
        }
      `}</style>
    </div>
  )
}

export default AdminExport
