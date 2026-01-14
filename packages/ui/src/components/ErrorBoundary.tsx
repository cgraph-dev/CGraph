/**
 * Error Boundary Component
 *
 * Production-grade error boundary with error reporting integration,
 * retry capabilities, and customizable fallback UI.
 */

import React, { Component, ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Fallback UI when error occurs */
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback when reset/retry is triggered */
  onReset?: () => void;
  /** Enable automatic retry on error */
  enableRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Component name for error tracking */
  componentName?: string;
  /** Isolation level - if true, errors won't propagate to parent boundaries */
  isolated?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

// =============================================================================
// Error Boundary Component
// =============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps: Partial<ErrorBoundaryProps> = {
    enableRetry: true,
    maxRetries: 3,
    isolated: false,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const info: ErrorInfo = {
      componentStack: errorInfo.componentStack || '',
    };

    this.setState({ errorInfo: info });

    // Call error callback
    if (this.props.onError) {
      this.props.onError(error, info);
    }

    // Report to observability (would integrate with observability client)
    this.reportError(error, info);
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // In production, this would use the observability client
    console.error('[ErrorBoundary] Caught error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName,
      retryCount: this.state.retryCount,
    });
  }

  private handleRetry = (): void => {
    const { maxRetries = 3, onReset } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });

      if (onReset) {
        onReset();
      }
    }
  };

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, enableRetry, maxRetries = 3 } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (typeof fallback === 'function') {
        return fallback(error, this.handleRetry);
      }

      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      const canRetry = enableRetry && retryCount < maxRetries;

      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </p>
            
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.stack}>
                  {error.name}: {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              {canRetry && (
                <button onClick={this.handleRetry} style={styles.retryButton}>
                  Try Again ({maxRetries - retryCount} attempts left)
                </button>
              )}
              <button onClick={this.handleReset} style={styles.resetButton}>
                Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// =============================================================================
// Styles
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    padding: '24px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  content: {
    textAlign: 'center',
    maxWidth: '480px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 600,
    color: '#991b1b',
  },
  message: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#b91c1c',
  },
  details: {
    marginBottom: '16px',
    textAlign: 'left',
  },
  summary: {
    cursor: 'pointer',
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  stack: {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '11px',
    overflow: 'auto',
    maxHeight: '200px',
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  resetButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#6366f1',
    border: '1px solid #6366f1',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

// =============================================================================
// HOC for functional components
// =============================================================================

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary componentName={displayName} {...boundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

// =============================================================================
// Suspense Error Boundary (for async components)
// =============================================================================

export interface SuspenseErrorBoundaryProps extends ErrorBoundaryProps {
  /** Loading fallback for Suspense */
  loadingFallback?: ReactNode;
}

export const SuspenseErrorBoundary: React.FC<SuspenseErrorBoundaryProps> = ({
  children,
  loadingFallback,
  ...errorBoundaryProps
}) => {
  return (
    <ErrorBoundary {...errorBoundaryProps}>
      <React.Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};

const DefaultLoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <div style={{ 
      width: '24px', 
      height: '24px', 
      border: '3px solid #e5e7eb',
      borderTopColor: '#6366f1',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);
