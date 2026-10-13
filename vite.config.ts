import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// Importing defineConfig from vitest/config lets Vite and Vitest share one config file.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
    // Remove once the first tests exist, so an accidentally empty test run fails CI.
    passWithNoTests: true,
  },
})
