/**
 * Route-level error boundary component.
 * @module
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { captureError, addBreadcrumb } from '@/lib/error-tracking';
import { routeLogger } from '@/lib/logger';
import { ErrorFallback } from '@/shared/components/error-fallback';

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

  /**
   * Retrieves derived state from error.
   *
   * @param error - The error instance.
   * @returns The derived state from error.
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  /**
   * component Did Catch for the feedback module.
   *
   * @param error - The error instance.
   * @param errorInfo - The error info.
   * @returns The result.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Add breadcrumb for context
    addBreadcrumb('navigation', `Route error in ${this.props.routeName || 'unknown route'}`, {
      routeName: this.props.routeName,
      componentStack: errorInfo.componentStack?.substring(0, 300),
    });

    // Capture error with route context
    captureError(error, {
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

    this.setState({ errorId: error.message });

    // Log in development
    if (import.meta.env.DEV) {
      routeLogger.error(`${this.props.routeName || 'Route'} crashed:`, error);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  /**
   * Renders the component.
   * @returns The result.
   */
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error!}
          resetErrorBoundary={this.handleRetry}
          componentName={this.props.routeName}
        />
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
