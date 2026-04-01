import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // ELK graph-layout engine (~1 MB minified) — split into own chunk
          elkjs: ['elkjs'],
          // React Flow renderer — split into own chunk
          xyflow: ['@xyflow/react'],
          // React runtime
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
