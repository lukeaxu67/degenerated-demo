import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages base path, must match repository name
  // e.g. https://lukeaxu67.github.io/degenerated-demo/
  base: '/degeneration-demo/',
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  ],
  define: {
    // Replace Node-style global with browser-safe globalThis
    global: 'globalThis',
  },
})
