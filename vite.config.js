import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuração do Vite: React + Tailwind CSS v4.
// Em desenvolvimento, use `npm run dev:full` (vercel dev) para subir front e /api juntos.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['api/**/*.test.js', 'src/**/*.test.js'],
  },
})
