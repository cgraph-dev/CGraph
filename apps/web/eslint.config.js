import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // React Hooks plugin - use flat config compatible approach
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  // Main config for all TypeScript/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        WebSocket: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        NodeList: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        process: 'readonly',
        crypto: 'readonly',
        indexedDB: 'readonly',
        navigator: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        structuredClone: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
      },
    },
    plugins: {
      react,
      'react-refresh': reactRefresh,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Disabled: This is a HMR convenience warning, not a production concern
      'react-refresh/only-export-components': 'off',

      // General
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Override: Allow console in lib folder (logger, errorTracking, etc.)
  {
    files: ['**/lib/**/*.ts', '**/lib/**/*.tsx'],
    rules: {
      'no-console': 'off',
    },
  },
  // Override: Allow console in stories, test pages, main.tsx, and middleware
  {
    files: ['**/*.stories.tsx', '**/pages/test/**/*.tsx', '**/main.tsx', '**/stores/middleware.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // Override: Disable react-refresh for stores, hooks, contexts, providers (non-component exports)
  {
    files: [
      '**/stores/**/*.ts',
      '**/hooks/**/*.ts',
      '**/contexts/**/*.tsx',
      '**/providers/**/*.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', '*.config.ts', 'coverage/'],
  }
);
