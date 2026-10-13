/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { TZ: 'America/Sao_Paulo' },
    // Node 25 expõe um localStorage global sem métodos, que o Vitest não troca pelo do jsdom.
    execArgv: ['--no-experimental-webstorage'],
    passWithNoTests: true,
  },
})
