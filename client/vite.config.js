import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  // FIX: Add server proxy to forward API requests to the backend
  server: {
    proxy: {
      '/api': {
        target: 'https://skillswap-production-75d5.up.railway.app/',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
