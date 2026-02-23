/**
 * Application entry point and root render.
 * @module
 */
// Startup debug logging (only in development)
// Note: Using console directly here because logger isn't loaded yet
const debugLog = import.meta.env.DEV
  ? // eslint-disable-next-line no-console
    (msg: string, ...args: unknown[]) => console.debug('[CGraph]', msg, ...args)
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
import ErrorBoundary from './components/error-boundary';
import { ThemeProvider } from './contexts/theme-context';
import { ThemeProviderEnhanced } from './contexts/theme-context-enhanced';
import { NotificationProvider } from './providers/notification-provider';
import { logger } from './lib/logger';
import './i18n'; // i18n initialization (must be before App)
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
      } catch (_e) {
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
  buster: 'v0.9.31-web', // Must match package.json version for cache invalidation
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

// Global loading fallback — plain dark background only (no spinner, instant feel)
function GlobalLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030712 0%, #0f0a1f 50%, #030712 100%)',
      }}
    />
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
