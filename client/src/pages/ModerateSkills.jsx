import { useEffect, useState } from 'react';
import adminService from './../services/adminService';
import { useNavigation } from './../context/NavigationContext';

const ModerateSkills = () => {
  const { setCurrentPage } = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSkillRequests(page);
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch skill requests:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch requests');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [page]);

  const handleDecision = async (userId, skillId, approved, skillType) => {
    let rejectionReason = null;
    if (!approved) {
      // In a real app, you would use a modal here instead of a prompt.
      rejectionReason = prompt("Please provide a reason for rejecting this skill:");
      if (!rejectionReason) {
        alert("Rejection requires a reason.");
        return;
      }
    }
    
    try {
      // Note: This approveSkill function might need skillType as another parameter.
      await adminService.approveSkill(userId, skillType, skillId, approved, rejectionReason);
      // Refresh the list after a decision
      fetchSkills();
    } catch (error) {
      console.error("Failed to update skill status:", error);
      alert("Could not update skill status.");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const renderSkills = (user, skillType) => {
    const skills = (skillType === 'offered' ? user.skillsOffered : user.skillsWanted)
      .filter(skill => skill.approved === false);

    if (skills.length === 0) return null;

    return (
      <>
        <h4 className={`text-lg font-semibold mt-4 mb-2 ${skillType === 'offered' ? 'text-cyan-300' : 'text-purple-300'}`}>
          {skillType === 'offered' ? 'Skills Offered' : 'Skills Wanted'}
        </h4>
        <ul className="divide-y divide-gray-700">
          {skills.map(skill => (
            <li key={skill._id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-grow">
                <p className="font-bold text-white">{skill.name} <span className="text-sm font-normal text-gray-400">({skill.level})</span></p>
                <p className="text-sm text-gray-300 mt-1">{skill.description}</p>
              </div>
              <div className="flex-shrink-0 mt-4 sm:mt-0 sm:ml-6 flex space-x-3">
                <button
                  onClick={() => handleDecision(user._id, skill._id, true, skillType)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(user._id, skill._id, false, skillType)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="text-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setCurrentPage('admin')} className="text-blue-400 hover:text-blue-300 mb-4">
          &larr; Back to Admin Dashboard
        </button>
        <h1 className="text-3xl font-bold text-cyan-300 mb-6">Moderate Pending Skills</h1>
        
        {loading ? (
          <p className="text-center py-8">Loading skill requests...</p>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>Error: {error}</p>
            <button onClick={fetchSkills} className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Retry</button>
          </div>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-yellow-400">No skills are currently pending approval.</p>
        ) : (
          <>
            <div className="space-y-8">
              {users.map(user => (
                <div key={user._id} className="bg-gray-800 shadow-lg rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white">{user.name}</h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  {renderSkills(user, 'offered')}
                  {renderSkills(user, 'wanted')}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-4">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-4 py-2 rounded bg-gray-600 disabled:opacity-50">Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="px-4 py-2 rounded bg-gray-600 disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ModerateSkills;