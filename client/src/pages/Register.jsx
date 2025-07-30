// src/pages/Register.jsx
import { useState } from 'react'
// import { useNavigate } from 'react-router-dom' // Remove this import
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

// Accept onPageChange as a prop
const Register = ({ onPageChange }) => { //
  // const navigate = useNavigate() // Remove this line
  const { login } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
  })

  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const res = await axios.post('http://localhost:8001/api/auth/register', form)

      login(res.data.user)

      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
      }

      onPageChange('home') // Navigate to 'home' after successful registration using onPageChange
    } catch (err) {
      console.error("Registration error:", err.response || err)
      setError(err.response?.data?.message || 'Registration failed.')
    }
  }

  const isFormValid = form.name && form.email && form.password && form.location

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-blue-gray-900 to-gray-900 px-6">
      <div className="bg-gradient-to-tr from-blue-700 to-blue-gray-800 shadow-lg rounded-2xl p-10 max-w-md w-full text-gray-100">
        <h2
          className="text-4xl font-bold mb-8 text-center tracking-tight bg-gradient-to-r from-cyan-400 via-blue-300 to-blue-500 bg-clip-text text-transparent select-none animate-subtleTilt"
        >
          Create Account
        </h2>

        {error && (
          <div className="bg-red-700 bg-opacity-75 px-5 py-3 rounded mb-6 text-sm font-semibold text-red-100 shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
          <Input
            label="Location"
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            placeholder="City, Country"
          />

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full font-semibold py-3 rounded-md shadow-md transition-colors duration-300 ${
              isFormValid
                ? 'bg-cyan-500 hover:bg-cyan-600 text-gray-900'
                : 'bg-cyan-800 text-gray-400 cursor-not-allowed'
            }`}
          >
            Register
          </button>
        </form>

        <p className="text-sm text-center mt-8 text-gray-400">
          Already have an account?{' '}
          {/* Change to a button and use onPageChange */}
          <button
            onClick={() => onPageChange('login')} //
            className="text-cyan-400 underline hover:text-cyan-500 transition"
          >
            Login
          </button>
        </p>
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
          cursor: default;
        }
      `}</style>
    </div>
  )
}

const Input = ({ label, ...props }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-semibold mb-2">{label}</label>
    <input
      {...props}
      id={props.name}
      className="w-full px-5 py-3 rounded-md bg-gray-800 border border-gray-600 placeholder-gray-400 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
      required
    />
  </div>
);

export default Register;