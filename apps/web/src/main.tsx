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
import './index.css';

// Development mode logging
if (import.meta.env.DEV) {
  console.log('[CGraph] Application initializing...');
  console.log('[CGraph] Environment:', import.meta.env.MODE);
  console.log('[CGraph] API URL:', import.meta.env.VITE_API_URL || 'http://localhost:4000');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep unused data for offline
      retry: 1,
      refetchOnWindowFocus: false,
      // Enable network mode for offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Mutations should pause when offline and resume when online
      networkMode: 'offlineFirst',
    },
  },
});

// Create a persister to save cache to localStorage for offline support
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'cgraph-query-cache',
  // Serialize/deserialize with error handling
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

// Persist the query client cache
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  // Only persist for 24 hours
  maxAge: 1000 * 60 * 60 * 24,
  // Bust cache on major version changes
  buster: 'v0.7.25',
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

// Global loading fallback component with dark theme
function GlobalLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900">
      <div className="relative">
        {/* Animated logo/spinner */}
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center animate-pulse shadow-lg shadow-primary-500/30">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        {/* Orbital ring */}
        <div className="absolute inset-0 -m-2 border-2 border-primary-500/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <p className="mt-6 text-gray-400 animate-pulse">Loading CGraph...</p>
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
  console.error('[CGraph] Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[CGraph] Unhandled promise rejection:', event.reason);
});

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<GlobalLoadingFallback />}>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
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
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);

if (import.meta.env.DEV) {
  console.log('[CGraph] Application mounted successfully');
}
