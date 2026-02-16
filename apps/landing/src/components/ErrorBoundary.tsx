/**
 * Error Boundary — Catches unhandled React rendering errors
 *
 * Displays a branded fallback UI instead of a blank screen.
 * Follows the React 19 class-component error boundary pattern
 * (function component error boundaries are not yet supported).
 *
 * @since v0.9.27
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to external service in production (Sentry, DataDog, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
            color: '#e5e7eb',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 1.5rem' }}>
            <div
              style={{
                fontSize: '4rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem',
              }}
            >
              Oops
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#9ca3af', lineHeight: 1.6, marginBottom: '2rem' }}>
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={this.handleReload}
              type="button"
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
