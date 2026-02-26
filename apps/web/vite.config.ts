/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // In test mode, redirect heavy packages to lightweight stubs.
      // vi.mock() in setup files causes vitest to hang in jsdom when test
      // files (directly or transitively) import the mocked module.
      // Vite resolve.alias intercepts at the resolver level — before Vite
      // even tries to compile the real package, preventing the hang.
      ...(process.env.VITEST
        ? {
            'framer-motion': path.resolve(__dirname, './src/test/__mocks__/framer-motion.tsx'),
            '@heroicons/react/24/outline': path.resolve(
              __dirname,
              './src/test/__mocks__/heroicons-outline.tsx'
            ),
            '@heroicons/react/24/solid': path.resolve(
              __dirname,
              './src/test/__mocks__/heroicons-solid.tsx'
            ),
            '@heroicons/react/20/solid': path.resolve(
              __dirname,
              './src/test/__mocks__/heroicons-20-solid.tsx'
            ),
          }
        : {}),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    // Per-test timeout — prevents stalled tests from blocking CI
    testTimeout: 10000,
    hookTimeout: 10000,
    // Coverage configuration
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test/**',
        '**/mocks/**',
        // Static data / constant arrays — no logic to test
        'src/data/**',
        '**/constants.ts',
        '**/unicode-emojis.ts',
        '**/presets.ts',
        // Experimental / WIP UI subsystems
        'src/components/enhanced/ui/holographic-ui/**',
        'src/components/enhanced/ui/holographic-ui-v4/**',
        // Theme template (static config, no logic)
        'src/themes/presets/theme-template.ts',
        // Page-level wiring (tested via E2E, not unit tests)
        'src/pages/**',
      ],
      // Coverage thresholds — ratchet approach: set just above current
      // level and increase as test coverage grows.
      // Current: lines ~42%, functions ~52%, branches ~69%
      // (after exclusions for static data / experimental UI / pages)
      thresholds: {
        statements: 40,
        branches: 55,
        functions: 50,
        lines: 40,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'https://cgraph-backend.fly.dev',
        changeOrigin: true,
        secure: true,
      },
      '/socket': {
        target: process.env.VITE_DEV_WS_TARGET || 'wss://cgraph-backend.fly.dev',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // SECURITY: 'hidden' generates .map files for error tracking services (Sentry, Datadog)
    // without exposing sourceMappingURL comments in production bundles.
    // Set VITE_ENABLE_SOURCEMAPS=true for full inline sourcemaps during debugging.
    sourcemap: process.env.VITE_ENABLE_SOURCEMAPS === 'true' ? true : 'hidden',
    // Chunk size warnings — flag chunks larger than 1MB for review.
    // Crypto libs and Three.js are expected to be large.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Use function for more granular control over chunking
        manualChunks: (id: string) => {
          // Core React - small and critical
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Routing
          if (id.includes('react-router')) {
            return 'router';
          }
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          // Headless UI
          if (id.includes('@headlessui')) {
            return 'headless-ui';
          }
          // Animation libraries
          if (id.includes('framer-motion')) {
            return 'animation';
          }
          // GSAP animation library
          if (id.includes('gsap')) {
            return 'animation-gsap';
          }
          // TanStack Query
          if (id.includes('@tanstack')) {
            return 'tanstack';
          }
          // State management
          if (id.includes('zustand')) {
            return 'state';
          }
          // Markdown rendering
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype') ||
            id.includes('unified') ||
            id.includes('mdast') ||
            id.includes('hast') ||
            id.includes('micromark')
          ) {
            return 'markdown';
          }
          // Utilities
          if (id.includes('date-fns')) {
            return 'utils-date';
          }
          if (id.includes('lodash')) {
            return 'utils-lodash';
          }
          // Icons
          if (id.includes('lucide-react') || id.includes('@heroicons')) {
            return 'icons';
          }
          // DOMPurify and sanitization
          if (id.includes('dompurify')) {
            return 'sanitize';
          }
          // Axios
          if (id.includes('axios')) {
            return 'http';
          }
        },
      },
    },
  },
});
