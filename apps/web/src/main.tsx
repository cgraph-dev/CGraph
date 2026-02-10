// Startup debug logging (only in development)
// Note: Using console directly here because logger isn't loaded yet
const debugLog = import.meta.env.DEV
  ? (msg: string, ...args: unknown[]) => console.debug('[CGraph]', msg, ...args)
  : () => {};

debugLog('Module loading - start');

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeProviderEnhanced } from './contexts/ThemeContextEnhanced';
import { NotificationProvider } from './providers/NotificationProvider';
import { logger } from './lib/logger';
import './index.css';

debugLog('All imports completed');
debugLog('Environment:', import.meta.env.MODE);
debugLog('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:4000');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Real-time messaging app: shorter stale times for dynamic content
      staleTime: 1000 * 30, // 30 seconds - better for real-time data
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep unused data for offline
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true, // Re-fetch when user returns to app
      refetchOnReconnect: true, // Re-fetch when coming back online
      // Enable network mode for offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Mutations should pause when offline and resume when online
      networkMode: 'offlineFirst',
      retry: 2,
    },
  },
});

// Create a persister to save cache to localStorage for offline support
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'cgraph-query-cache',
  // Serialize/deserialize with error handling
  serialize: (data) => {
    try {
      return JSON.stringify(data);
    } catch (error) {
      logger.warn('Failed to serialize cache:', error);
      return '{}';
    }
  },
  deserialize: (data) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      logger.warn('Failed to deserialize cache, clearing corrupted data:', error);
      // Clear corrupted cache
      try {
        window.localStorage.removeItem('cgraph-query-cache');
      } catch (e) {
        // Ignore localStorage errors
      }
      return {};
    }
  },
});

// Persist the query client cache
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24,
  buster: 'v0.9.6-web', // Updated to match current version
});

// Track online/offline status for offline-first behavior
if (typeof window !== 'undefined') {
  onlineManager.setEventListener((setOnline) => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });
}

// Global loading fallback component - zero-dependency (no framer-motion/AnimatedLogo)
// Uses inline styles to guarantee rendering even if CSS chunks fail to load
function GlobalLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #030712 0%, #0f0a1f 50%, #030712 100%)',
        gap: '24px',
      }}
    >
      <svg width="48" height="48" viewBox="0 0 50 50">
        <defs>
          <linearGradient id="loading-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#loading-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="80 45"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <span
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        CGraph
      </span>
    </div>
  );
}

// Root element validation
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('[CGraph] Root element not found. Check index.html for <div id="root"></div>');
}

// Handle uncaught errors at the window level
window.addEventListener('error', (event) => {
  logger.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});

// Helper: remove the static HTML loader so the 15s timeout never fires
function removeInitialLoader() {
  const loader = document.getElementById('initial-loader');
  if (loader) loader.remove();
}

debugLog('Creating React root...');
try {
  const root = ReactDOM.createRoot(rootElement);
  debugLog('Root created, rendering...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<GlobalLoadingFallback />}>
          <ThemeProvider>
            <ThemeProviderEnhanced>
              <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                  <NotificationProvider>
                    <App />
                  </NotificationProvider>
                  <Toaster
                    position="bottom-right"
                    toastOptions={{
                      className: 'bg-dark-800 text-white border border-dark-700',
                      duration: 4000,
                      style: {
                        background: '#1f2937',
                        color: '#fff',
                      },
                    }}
                  />
                </BrowserRouter>
              </QueryClientProvider>
            </ThemeProviderEnhanced>
          </ThemeProvider>
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
  // React has mounted — remove the static HTML loader immediately
  removeInitialLoader();
  debugLog('Application rendered successfully');
} catch (err) {
  // Even on error, remove the loader so ErrorBoundary or fallback UI is visible
  removeInitialLoader();
  logger.error('Failed to render:', err);
}

debugLog('Application mounted');
