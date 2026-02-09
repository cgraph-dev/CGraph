import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
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
    addBreadcrumb({
      category: 'error',
      message: 'React Error Boundary triggered',
      level: 'error',
      data: {
        componentName: this.props.componentName,
        componentStack: errorInfo.componentStack?.substring(0, 500),
      },
    });

    // Capture error with full context
    const errorId = captureError(error, {
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

    this.setState({ errorId });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log error (sanitized in production via logger)
    logger.error('Caught an error:', error.message);
  }

  handleRetry = (): void => {
    addBreadcrumb({
      category: 'user',
      message: 'User clicked retry after error',
      level: 'info',
    });
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  handleReload = (): void => {
    addBreadcrumb({
      category: 'user',
      message: 'User clicked reload after error',
      level: 'info',
    });
    window.location.reload();
  };

  handleReportIssue = (): void => {
    // Open support with error context
    const errorId = this.state.errorId;
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
        <div className="flex min-h-screen items-center justify-center bg-dark-900 p-8">
          <motion.div
            className="max-w-md text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/50 bg-red-900/30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: [0, -5, 5, -3, 3, 0] }}
              transition={{
                scale: { type: 'spring', stiffness: 400, damping: 20 },
                x: { delay: 0.3, duration: 0.5 },
              }}
            >
              <svg
                className="h-8 w-8 text-red-500"
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
            </motion.div>
            <motion.h2
              className="mb-2 text-xl font-semibold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Something went wrong
            </motion.h2>
            <motion.p
              className="mb-4 text-gray-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              We encountered an unexpected error. Please try again or contact support if the problem
              persists.
            </motion.p>
            {this.state.errorId && (
              <motion.p
                className="mb-4 inline-block rounded bg-dark-800 px-3 py-2 font-mono text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                Error ID: {this.state.errorId}
              </motion.p>
            )}
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                onClick={this.handleRetry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
              >
                Try Again
              </motion.button>
              <motion.button
                onClick={this.handleReload}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg border border-dark-600 px-4 py-2 text-gray-300 transition-colors hover:bg-dark-800"
              >
                Reload Page
              </motion.button>
              <motion.button
                onClick={this.handleReportIssue}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Report Issue
              </motion.button>
            </motion.div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-dark-700 bg-dark-800 p-4 text-xs text-red-400">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
