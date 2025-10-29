import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',  // Explicit: ensures public/ folder assets are copied to dist/
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    copyPublicDir: true  // Ensure public/ directory is copied during build
  }
})