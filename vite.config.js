import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    visualizer({
      open: true, // Automatically opens the browser stats page after building
      filename: 'bundle-analysis.html', // Name of the file it will generate
      gzipSize: true, // Shows you how big the file will be when compressed
    })
  ],
})
