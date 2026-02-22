import { Component, ErrorInfo, ReactNode } from 'react';
import { captureError, addBreadcrumb } from '@/lib/error-tracking';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Component name for error context */
  componentName?: string;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the
 * child component tree and displays a fallback UI instead of crashing.
 *
 * Features:
 * - Automatic error tracking integration
 * - Error ID for support reference
 * - Breadcrumb trail for debugging
 * - Graceful recovery options
 *
 * @version 2.0.0
 * @since v0.7.58
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Add breadcrumb for context
    addBreadcrumb('ui', 'React Error Boundary triggered', {
      componentName: this.props.componentName,
      componentStack: errorInfo.componentStack?.substring(0, 500),
    });

    // Capture error with full context
    captureError(error, {
      component: this.props.componentName || 'ErrorBoundary',
      action: 'component_crash',
      level: 'fatal',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
      tags: {
        errorBoundary: 'true',
        recoverable: 'true',
      },
    });

    this.setState({ errorId: error.message });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log error (sanitized in production via logger)
    logger.error('Caught an error:', error.message);
  }

  handleRetry = (): void => {
    addBreadcrumb('user', 'User clicked retry after error');
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  handleReload = (): void => {
    addBreadcrumb('user', 'User clicked reload after error');
    window.location.reload();
  };

  handleReportIssue = (): void => {
    // Open support with error context
    const { errorId } = this.state;
    const supportUrl = errorId
      ? `mailto:support@cgraph.org?subject=Error Report ${errorId}&body=Error ID: ${errorId}%0A%0APlease describe what you were doing when this error occurred:%0A%0A`
      : 'mailto:support@cgraph.org?subject=Error Report&body=Please describe what you were doing when this error occurred:%0A%0A';
    window.open(supportUrl, '_blank');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #030712 0%, #0f0a1f 50%, #030712 100%)',
            padding: '2rem',
          }}
        >
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <div
              style={{
                width: '4rem',
                height: '4rem',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                background: 'rgba(127, 29, 29, 0.3)',
              }}
            >
              <svg
                style={{ width: '2rem', height: '2rem', color: '#ef4444' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2
              style={{
                marginBottom: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              Something went wrong
            </h2>
            <p style={{ marginBottom: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              We encountered an unexpected error. Please try again or contact support if the problem
              persists.
            </p>
            {this.state.errorId && (
              <p
                style={{
                  marginBottom: '1rem',
                  display: 'inline-block',
                  borderRadius: '0.375rem',
                  background: '#1f2937',
                  padding: '0.5rem 0.75rem',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                }}
              >
                Error ID: {this.state.errorId}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0.75rem',
              }}
            >
              <button
                onClick={this.handleRetry}
                style={{
                  borderRadius: '0.5rem',
                  background: '#7c3aed',
                  padding: '0.5rem 1rem',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  borderRadius: '0.5rem',
                  border: '1px solid #4b5563',
                  background: 'transparent',
                  padding: '0.5rem 1rem',
                  color: '#d1d5db',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReportIssue}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Report Issue
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#6b7280' }}>
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    maxHeight: '12rem',
                    overflow: 'auto',
                    borderRadius: '0.5rem',
                    border: '1px solid #374151',
                    background: '#1f2937',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    color: '#f87171',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
