/**
 * React Integration Helpers
 *
 * HOC and hook for ergonomic error capture in React components.
 *
 * @module lib/error-tracking/react
 */

import { captureError } from './queue';
import { addBreadcrumb } from './breadcrumbs';

/**
 * HOC that wraps a component with error capture on render failures.
 */
export function withErrorTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function ErrorTrackedComponent(props: P) {
    try {
      return <WrappedComponent {...props} />;
    } catch (error) {
       
      captureError(error as Error, {
        // safe downcast – structural boundary
        component: componentName,
        action: 'render_error',
      });
      throw error;
    }
  };
}

/**
 * Hook for manual error capture scoped to a component.
 *
 * @param componentName - Name used in error context
 */
export function useErrorTracking(componentName: string) {
  return {
    captureError: (error: Error | string, action?: string) =>
      captureError(error, { component: componentName, action }),
    addBreadcrumb: (message: string, data?: Record<string, unknown>) =>
      addBreadcrumb({ category: 'ui', message, data }),
  };
}
