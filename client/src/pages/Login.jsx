import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login = ({ onPageChange }) => { // ✅ Accept onPageChange as prop
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    
    try {
      const res = await axios.post('http://localhost:8001/api/auth/login', {
        email,
        password,
      })
      
      login(res.data.user) // ✅ Set user in context
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token) // ✅ Store token for later use
      }
      
      onPageChange('home') // ✅ Navigate to home using prop function
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.')
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 px-6">
      <div className="bg-gradient-to-tr from-blue-700 to-blue-gray-800 shadow-lg rounded-2xl p-10 max-w-md w-full text-gray-100">
        <h2
          className="text-4xl font-bold mb-8 text-center tracking-tight bg-gradient-to-r from-cyan-400 via-blue-300 to-blue-500 bg-clip-text text-transparent select-none animate-subtleTilt"
          style={{ textShadow: '0 4px 10px rgba(0,0,0,0.7)' }}
        >
          Welcome Back
        </h2>
        
        {error && (
          <div className="bg-red-700 bg-opacity-75 px-5 py-3 rounded mb-6 text-sm font-semibold text-red-100 shadow-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-5 py-3 rounded-md bg-gray-800 border border-gray-600 placeholder-gray-400 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-5 py-3 rounded-md bg-gray-800 border border-gray-600 placeholder-gray-400 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-semibold py-3 rounded-md shadow-md transition-colors duration-300"
          >
            Login
          </button>
        </form>
        
        <p className="text-sm text-center mt-8 text-gray-400">
          Don't have an account?{' '}
          <button 
            onClick={() => onPageChange('register')}
            className="text-cyan-400 underline hover:text-cyan-500 transition"
          >
            Register
          </button>
        </p>
      </div>
      
      <style>{`
        @keyframes subtleTilt {
          0%, 100% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: rotateX(2deg) rotateY(2deg);
          }
        }
        .animate-subtleTilt {
          animation: subtleTilt 12s ease-in-out infinite;
          display: inline-block;
          transform-style: preserve-3d;
          perspective: 800px;
          cursor: default;
        }
      `}</style>
    </div>
  )
};

export default Login;