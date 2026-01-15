import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Usar rutas relativas para un despliegue flexible (ej. subcomité de GitHub Pages)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
