/**
 * ESLint Configuration for CGraph Mobile App
 * 
 * Uses the flat config format (ESLint 9+) with TypeScript and React support.
 * Includes strict react-hooks rules to prevent hook ordering violations.
 * 
 * @since v0.7.29
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // React Native globals
        __DEV__: 'readonly',
        global: 'readonly',
        window: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
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
        React: 'readonly',
        JSX: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        crypto: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        // Jest globals
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      
      // React rules - these are critical for preventing hook violations
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      
      // React Hooks rules - STRICT MODE
      // These rules are essential for preventing "Rendered more hooks than during
      // the previous render" errors by catching hook ordering violations at build time.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General JavaScript rules
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'warn',
      'no-duplicate-imports': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      
      // Code style (suggestions only)
      'curly': ['warn', 'multi-line'],
      'dot-notation': 'warn',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/',
      '.expo/',
      'android/',
      'ios/',
      'coverage/',
      '*.config.js',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'app.config.js',
    ],
  },
);
