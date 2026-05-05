import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('@tanstack')) return 'vendor';
            if (id.includes('d3') || id.includes('recharts')) return 'charts';
            if (id.includes('three')) return 'three';
            if (id.includes('leaflet')) return 'maps';
            return 'modules';
          }
        }
      }
    }
  }
})
