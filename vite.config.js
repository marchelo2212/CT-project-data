import { defineConfig } from 'vite'

export default defineConfig({
  base: '/CT-project-data/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
