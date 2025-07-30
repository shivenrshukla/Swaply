const UserCard = ({ user, onRequestSwap, className = '' }) => {
  return (
    <div
      className={`bg-gradient-to-br from-gray-800 to-blue-gray-900 border border-blue-700 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/30 hover:border-cyan-400 ${className}`}
    >
      <img
        src={user.profilePhoto || 'https://i.pravatar.cc/150?img=3'}
        alt={user.name}
        className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-blue-500 shadow-md hover:border-cyan-400 transition-colors duration-300"
      />

      <h2 className="text-xl font-semibold text-cyan-300 mb-1">{user.name}</h2>
      <p className="text-sm text-blue-200 mb-2">{user.location}</p>

      <div className="mb-4 text-sm text-blue-300">
        <p className="mb-1">
          <span className="font-semibold">Availability:</span> {user.availability || 'N/A'}
        </p>
        <p className="mb-1">
          <span className="font-semibold">Rating:</span> {user.averageRating} ({user.totalRatings} ratings)
        </p>
      </div>

      <div className="mb-4 w-full">
        <p className="text-xs text-blue-200 mb-2 uppercase tracking-wide">Skills Offered</p>
        <div className="flex flex-wrap gap-1 justify-center">
          {user.skillsOffered?.length > 0 ? (
            user.skillsOffered.map((skill, index) => (
              <span
                key={skill._id || index}
                className="bg-blue-600/30 text-blue-200 px-2 py-1 rounded-full text-xs border border-blue-500/30"
                title={skill.description}
              >
                {skill.name} ({skill.level})
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-sm">No skills listed</span>
          )}
        </div>
      </div>

      {user.isAdmin && (
        <p className="text-xs text-yellow-400 mb-2 font-semibold">Admin</p>
      )}

      {user.isBanned && (
        <p className="text-xs text-red-400 mb-2 font-semibold">
          Banned: {user.banReason || 'No reason provided'}
        </p>
      )}

      <button
        onClick={() => onRequestSwap(user)}
        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        Request Swap
      </button>
    </div>
  )
}

export default UserCard
