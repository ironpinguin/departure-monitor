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
      },
      // Munich EFA stop search: efa.mvv-muenchen.de sends no CORS headers,
      // so it must be proxied (unlike www.mvv-muenchen.de which allows *).
      '/mvv-efa-api': {
        target: 'https://efa.mvv-muenchen.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mvv-efa-api/, ''),
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
