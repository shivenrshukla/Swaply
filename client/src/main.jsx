import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' 
import { NavigationProvider } from './context/NavigationContext'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <NavigationProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </NavigationProvider>
)
