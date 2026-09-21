import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Leaflet + framer-motion make the main bundle about 590 kB. That is fine for a demo served locally,
    // so raise the warning limit instead of printing the same harmless warning on every build.
    chunkSizeWarningLimit: 700,
  },
})
