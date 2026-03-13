/**
 * QueryBoundary — Composable Suspense + ErrorBoundary for React Query
 *
 * Eliminates per-page `if (isLoading)` / `if (isError)` boilerplate by
 * combining React's `<Suspense>` with an `<ErrorBoundary>`, providing
 * query-aware loading and error fallbacks.
 *
 * Usage:
 * ```tsx
 * <QueryBoundary
 *   loadingFallback={<ConversationSkeleton />}
 *   errorFallback={({ error, reset }) => <ErrorState error={error} onRetry={reset} />}
 * >
 *   <MyQueryComponent />
 * </QueryBoundary>
 * ```
 *
 * @module components/feedback/QueryBoundary
 * @version 1.0.0
 */

import { Component, type ErrorInfo, type ReactNode, Suspense } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/feedback/loading-spinner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('QueryBoundary');

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

interface QueryBoundaryProps {
  children: ReactNode;
  /** Custom loading fallback — defaults to LoadingSpinner */
  loadingFallback?: ReactNode;
  /** Render prop for error state — receives error + reset function */
  errorFallback?: (props: ErrorFallbackProps) => ReactNode;
  /** Optional component name for logging context */
  componentName?: string;
}

// ─── Inner Error Boundary (class component) ───────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface InnerErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
  renderFallback?: (props: ErrorFallbackProps) => ReactNode;
  componentName?: string;
}

class QueryErrorBoundaryInner extends Component<InnerErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: InnerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Query boundary caught error', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, renderFallback } = this.props;

    if (hasError && error) {
      if (renderFallback) {
        return renderFallback({ error, reset: this.handleReset });
      }

      // Default error fallback
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
            <p className="mt-1 text-sm text-gray-400">{error.message}</p>
          </div>
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500"
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}

// ─── Main QueryBoundary Component ─────────────────────────────────────────────

/**
 * Composable wrapper combining React Suspense with an error boundary,
 * purpose-built for React Query data fetching patterns.
 *
 * - Suspense catches the loading state → shows `loadingFallback`
 * - ErrorBoundary catches fetch errors → shows `errorFallback` with retry
 * - Reset integrates with React Query's `useQueryErrorResetBoundary`
 */
export function QueryBoundary({
  children,
  loadingFallback,
  errorFallback,
  componentName,
}: QueryBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <QueryErrorBoundaryInner
      onReset={reset}
      renderFallback={errorFallback}
      componentName={componentName}
    >
      <Suspense fallback={loadingFallback ?? <LoadingSpinner />}>{children}</Suspense>
    </QueryErrorBoundaryInner>
  );
}

export default QueryBoundary;
