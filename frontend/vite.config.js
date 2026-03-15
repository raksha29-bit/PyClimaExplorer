import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the current directory path (required for ES modules)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // The absolute path bypasses Vite's strict export dictionary completely!
      // Updated to point to the actual existing compiled ES module file
      'react-map-gl': path.resolve(__dirname, 'node_modules/react-map-gl/dist/mapbox.js')
    }
  }
})
