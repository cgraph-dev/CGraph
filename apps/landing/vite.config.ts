import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip', threshold: 1024 }),
    compression({ algorithm: 'brotliCompress', threshold: 1024 }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 800,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ['gsap'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          'framer-motion': ['framer-motion'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 3001,
  },
});
