import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['app/frontend/test/setup.tsx'],
    globals: true,
    exclude: ['**/node_modules/**', '**/vendor/**', '**/dist/**'],
    include: ['app/frontend/**/*.{test,spec}.{ts,tsx}'],
  },
})
