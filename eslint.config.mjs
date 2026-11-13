import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  ...expoConfig,
  {
    ignores: ['**/node_modules/**', '**/.expo/**', '**/coverage/**', '**/dist/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'react/jsx-no-useless-fragment': 'warn',
    },
  },
]);

