import { Component, ErrorInfo, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { captureError, addBreadcrumb } from '@/lib/error-tracking';
import { routeLogger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  /** Route name for error context */
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Lightweight Error Boundary for route-level error handling.
 *
 * Unlike the full ErrorBoundary, this component:
 * - Shows a simpler UI that matches the app design
 * - Provides navigation back to safe routes
 * - Doesn't crash the entire app when a single route fails
 *
 * @version 1.0.0
 * @since v0.7.59
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Add breadcrumb for context
    addBreadcrumb({
      category: 'navigation',
      message: `Route error in ${this.props.routeName || 'unknown route'}`,
      level: 'error',
      data: {
        routeName: this.props.routeName,
        componentStack: errorInfo.componentStack?.substring(0, 300),
      },
    });

    // Capture error with route context
    const errorId = captureError(error, {
      component: this.props.routeName || 'RouteErrorBoundary',
      action: 'route_crash',
      level: 'error',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
      tags: {
        errorBoundary: 'route',
        recoverable: 'true',
      },
    });

    this.setState({ errorId });

    // Log in development
    if (import.meta.env.DEV) {
      routeLogger.error(`${this.props.routeName || 'Route'} crashed:`, error);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <RouteErrorFallback
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          routeName={this.props.routeName}
          error={this.state.error}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback UI component for route errors
 */
function RouteErrorFallback({
  errorId,
  onRetry,
  routeName,
  error,
}: {
  errorId: string | null;
  onRetry: () => void;
  routeName?: string;
  error: Error | null;
}) {
  const location = useLocation();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-900/20">
          <svg
            className="h-7 w-7 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-lg font-semibold text-white">
          {routeName ? `${routeName} failed to load` : 'Page failed to load'}
        </h2>

        <p className="mb-4 text-sm text-gray-400">
          There was a problem loading this section. You can try again or navigate to another page.
        </p>

        {errorId && (
          <p className="mb-4 inline-block rounded bg-dark-800/50 px-3 py-1.5 font-mono text-xs text-gray-500">
            Ref: {errorId}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={onRetry}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700"
          >
            Try Again
          </button>
          <Link
            to="/messages"
            className="rounded-lg border border-dark-600 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-800"
          >
            Go to Messages
          </Link>
          <Link
            to="/"
            className="px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            Home
          </Link>
        </div>

        {/* Development-only error details */}
        {import.meta.env.DEV && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300">
              Error Details (Dev)
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded border border-dark-700 bg-dark-800 p-3 text-xs text-red-400">
              {error.toString()}
              {'\n\nPath: '}
              {location.pathname}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default RouteErrorBoundary;
