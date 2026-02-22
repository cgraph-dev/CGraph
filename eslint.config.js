import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import checkFile from 'eslint-plugin-check-file';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.docusaurus/**',
      '**/coverage/**',
    ],
  },
  // React Hooks plugin for apps/web, apps/mobile, and apps/landing files
  {
    files: ['apps/web/**/*.{ts,tsx}', 'apps/mobile/**/*.{ts,tsx}', 'apps/landing/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  // Architectural boundary rules for web app — ENFORCED (error not warn)
  {
    files: [
      'apps/web/src/components/**/*.{ts,tsx}',
      'apps/web/src/shared/components/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/stores/*', '!@/stores/hooks', '!@/stores/index'],
              message:
                'Components should use store hooks from @/stores/hooks, not import stores directly.',
            },
            {
              group: ['@/services/*'],
              message: 'Components should not import services directly. Use hooks instead.',
            },
          ],
        },
      ],
    },
  },
  // Pages can use hooks and components — ENFORCED
  {
    files: ['apps/web/src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services/*'],
              message: 'Pages should use hooks to access services, not import directly.',
            },
          ],
        },
      ],
    },
  },
  // Mobile architectural boundaries — ENFORCED
  {
    files: [
      'apps/mobile/src/screens/**/*.{ts,tsx}',
      'apps/mobile/src/shared/components/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services/*'],
              message:
                'Screens/components should not import services directly. Use hooks or stores instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      // typescript-eslint v8 flat config: recommended is an array of config objects,
      // not a single object. Extract and merge rules from all entries.
      ...tseslint.configs.recommended.reduce((acc, cfg) => ({ ...acc, ...(cfg.rules || {}) }), {}),
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  // Enforce logger usage instead of console in source files
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'apps/mobile/src/**/*.{ts,tsx}'],
    ignores: ['**/lib/logger.ts', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'], // Allow console.warn/error as fallback
        },
      ],
    },
  },
  // Ban explicit 'any' type assertions
  {
    files: [
      'apps/landing/src/**/*.{ts,tsx}',
      'apps/web/src/**/*.{ts,tsx}',
      'apps/mobile/src/**/*.{ts,tsx}',
      'packages/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  // Prevent regressions: ban React.FC, forwardRef, useContext (React 19 migration complete)
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'apps/mobile/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'TSTypeReference[typeName.right.name="FC"], TSTypeReference[typeName.name="FC"]',
          message:
            'Do not use React.FC. Use plain function declarations with typed props and explicit return type instead.',
        },
        {
          selector:
            'TSTypeReference[typeName.right.name="FunctionComponent"], TSTypeReference[typeName.name="FunctionComponent"]',
          message:
            'Do not use React.FunctionComponent. Use plain function declarations with typed props instead.',
        },
        {
          selector: 'CallExpression[callee.name="forwardRef"]',
          message: 'Do not use forwardRef. In React 19, ref is a regular prop — pass it directly.',
        },
        {
          selector: 'CallExpression[callee.object.name="React"][callee.property.name="forwardRef"]',
          message:
            'Do not use React.forwardRef. In React 19, ref is a regular prop — pass it directly.',
        },
        {
          selector: 'CallExpression[callee.name="useContext"]',
          message:
            'Do not use useContext(). In React 19, use the use() hook instead: use(MyContext).',
        },
      ],
    },
  },
  // Enforce kebab-case filenames for component files (*.tsx)
  // Hooks, stores, and utils retain camelCase convention
  {
    files: ['apps/web/src/**/*.tsx', 'apps/mobile/src/**/*.tsx'],
    ignores: ['**/App.tsx', '**/__tests__/**'],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.tsx': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
];
