/**
 * Global error boundary component.
 * @module
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — fallback UI for error states.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Retrieves derived state from error.
   *
   * @param error - The error instance.
   * @returns The derived state from error.
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * component Did Catch for the error-boundary.tsx module.
   *
   * @param error - The error instance.
   * @param errorInfo - The error info.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  /**
   * Renders the component.
   */
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0a0a0a',
            color: '#e5e5e5',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#a3a3a3', marginBottom: '1.5rem', textAlign: 'center' }}>
            The application encountered an unexpected error. Try refreshing the page.
          </p>
          <pre
            style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '0.5rem',
              padding: '1rem',
              maxWidth: '600px',
              overflow: 'auto',
              fontSize: '0.875rem',
              color: '#f87171',
              marginBottom: '1.5rem',
            }}
          >
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#22c55e',
              color: '#000',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
