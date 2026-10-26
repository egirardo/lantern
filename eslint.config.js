import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // The game region is a focusable div with role="application": it handles its
    // own arrow keys, which is what that role is for. The plugin's recommended
    // config only allows 'tabpanel', so allow 'application' as well. Every other
    // focusable non-interactive element is still an error.
    files: ['**/*.{ts,tsx}'],
    rules: {
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        {
          tags: [],
          roles: ['tabpanel', 'application'],
          allowExpressionValues: true,
        },
      ],
    },
  },
  {
    // Architecture rule 1: game logic stays pure TypeScript so it can be unit tested.
    files: ['src/game/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['phaser', 'react', 'react-dom', 'zustand'],
              message:
                'src/game/ must not depend on Phaser, React or Zustand (see CLAUDE.md, architecture rule 1).',
            },
          ],
        },
      ],
    },
  },
])
