import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Lazy load pages for optimal performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Auth pages are handled via Vercel redirects to web.cgraph.org

// Legal Pages
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const GDPR = lazy(() => import('./pages/legal/GDPR'));

// Company Pages
const About = lazy(() => import('./pages/company/About'));
const Careers = lazy(() => import('./pages/company/Careers'));
const Contact = lazy(() => import('./pages/company/Contact'));
const Press = lazy(() => import('./pages/company/Press'));

// Resource Pages
const Download = lazy(() => import('./pages/resources/Download'));
const Documentation = lazy(() => import('./pages/resources/Documentation'));
const Blog = lazy(() => import('./pages/resources/Blog'));
const BlogArticle = lazy(() => import('./pages/resources/BlogArticle'));
const DocArticle = lazy(() => import('./pages/resources/DocArticle'));
const Status = lazy(() => import('./pages/resources/Status'));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-500" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Auth routes are handled by Vercel redirects to web.cgraph.org */}

              {/* Legal Pages */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/gdpr" element={<GDPR />} />

              {/* Company Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/press" element={<Press />} />

              {/* Resource Pages */}
              <Route path="/download" element={<Download />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/docs/:slug" element={<DocArticle />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/status" element={<Status />} />

              {/* Static Pages - redirect to sections */}
              <Route path="/features" element={<Navigate to="/#features" replace />} />
              <Route path="/security" element={<Navigate to="/#security" replace />} />
              <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />

              {/* Catch-all — branded 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Analytics />
          <SpeedInsights />
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);
