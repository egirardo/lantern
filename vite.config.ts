import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// Importing defineConfig from vitest/config lets Vite and Vitest share one config file.
// The config is a function so it gets the `mode` ('development', 'production',
// or 'test' when Vitest runs), which loadEnv below needs.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
    // Vite only loads env variables that start with VITE_ from .env.local.
    // The RLS integration tests also need the test users' logins, which must
    // NOT start with VITE_ (that would put them in the browser bundle).
    // loadEnv reads the .env files and returns only the variables that start
    // with 'TEST_USER_'. `test.env` makes them available in the tests only;
    // `vite build` ignores the `test` block, so they never reach the bundle.
    env: loadEnv(mode, process.cwd(), 'TEST_USER_'),
  },
}))
