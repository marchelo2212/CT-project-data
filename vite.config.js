import { defineConfig } from 'vite'

export default defineConfig({
  base: '/CT-project-data/', // Correct base path for project pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
