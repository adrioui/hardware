import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Verilog Visualizer',
        short_name: 'VerilogViz',
        description: 'Progressive web-based Verilog visualizer — hierarchy view, RTL schematic, simulation + waveforms',
        theme_color: '#1a1b26',
        background_color: '#1a1b26',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
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
