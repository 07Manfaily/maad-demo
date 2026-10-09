import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : le build fonctionne aussi bien sur GitHub Pages que dans un sous-dossier.
export default defineConfig({
  plugins: [react()],
  base: './',
})
