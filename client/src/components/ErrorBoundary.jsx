// src/components/ErrorBoundary.jsx
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    console.error('ErrorBoundary caught an error:', error)
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error details:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-center p-4">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Chat Error</h2>
            <p className="text-gray-600 mb-4">Something went wrong with the chat.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary