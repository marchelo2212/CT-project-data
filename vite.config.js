import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Use relative paths for maximum compatibility
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
