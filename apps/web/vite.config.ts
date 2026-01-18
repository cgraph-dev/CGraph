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
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    // Coverage configuration with thresholds (matching mobile at 60%)
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
      ],
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
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
    sourcemap: true,
    // Increase limit to avoid warnings for expected large chunks
    chunkSizeWarningLimit: 1500,
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
          // TanStack Query
          if (id.includes('@tanstack')) {
            return 'tanstack';
          }
          // State management
          if (id.includes('zustand')) {
            return 'state';
          }
          // Web3 - split into separate chunks for lazy loading
          if (id.includes('wagmi') || id.includes('@wagmi')) {
            return 'web3-wagmi';
          }
          if (id.includes('viem')) {
            return 'web3-viem';
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
