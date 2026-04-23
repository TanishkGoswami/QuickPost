import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    hmr: {
      host: 'shorts-very-joystick.ngrok-free.dev',
      clientPort: 443,
      protocol: 'wss'
    },
    allowedHosts: ["shorts-very-joystick.ngrok-free.dev"],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      }
    }
  }
})
