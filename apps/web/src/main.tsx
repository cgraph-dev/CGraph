console.log('[CGraph] Module loading - start');

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
import AnimatedLogo from './components/AnimatedLogo';
import './index.css';

console.log('[CGraph] All imports completed successfully');

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
      {/* Background particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}

      <div className="relative z-10">
        <AnimatedLogo size="lg" showText variant="loading" />
      </div>
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

console.log('[CGraph] About to call ReactDOM.createRoot...');
try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('[CGraph] Root created, about to render...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<GlobalLoadingFallback />}>
          <ThemeProvider>
            <ThemeProviderEnhanced>
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
            </ThemeProviderEnhanced>
          </ThemeProvider>
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('[CGraph] Render called successfully');
} catch (err) {
  console.error('[CGraph] Failed to render:', err);
}

if (import.meta.env.DEV) {
  console.log('[CGraph] Application mounted successfully');
}
