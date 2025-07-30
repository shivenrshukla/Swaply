import { useState } from 'react';
import adminService from '../services/adminService';

const Announcements = ({ onPageChange }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Sending...');
    try {
      const res = await adminService.sendBroadcast({ title, content });
      setMessage(res.data.message);
    } catch (err) {
      setMessage('Failed to send announcement.');
      console.error(err);
    }
  };

  return (
    <div className="text-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => onPageChange('admin')} className="text-blue-400 hover:text-blue-300 mb-4">
          &larr; Back to Admin Dashboard
        </button>
        <h1 className="text-3xl font-bold text-cyan-300 mb-6">Send Announcement</h1>
        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">Content</label>
            <textarea
              id="content"
              rows="6"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg">
            Send Broadcast
          </button>
          {message && <p className="text-center mt-4">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default Announcements;
