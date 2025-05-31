import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for Electron
  server: {
    proxy: {
      '/wuerzburg-api': {
        target: 'https://whitelabel.bahnland-bayern.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wuerzburg-api/, ''),
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext',
    minify: false, // Disable minification for debugging
    rollupOptions: {
      output: {
        manualChunks: undefined,
        format: 'es'
      }
    }
  }
})
