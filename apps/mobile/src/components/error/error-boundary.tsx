/**
 * Error Boundary Component
 *
 * React Error Boundary for catching and handling runtime errors.
 * Prevents full app crashes by containing errors to specific screen boundaries.
 *
 * @module components/error/ErrorBoundary
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { createLogger } from '../../lib/logger';
import { captureError, addBreadcrumb } from '../../lib/error-tracking';

const logger = createLogger('ErrorBoundary');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback component to render on error */
  fallback?: ReactNode;
  /** Name of the boundary for logging */
  name?: string;
  /** Whether to show error details (dev mode) */
  showDetails?: boolean;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom retry handler */
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 *
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   *
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   *
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { name = 'Unknown', onError } = this.props;

    // Log error with context
    logger.error(`Error caught in boundary: ${name}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });

    // Call onError callback if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Send to error tracking service
    addBreadcrumb('ui', `Error Boundary triggered: ${name}`, {
      componentStack: errorInfo.componentStack?.substring(0, 500),
    });
    captureError(error, {
      component: name,
      action: 'error_boundary_catch',
      metadata: { componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { onRetry } = this.props;

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (onRetry) {
      onRetry();
    }
  };

  /**
   *
   */
  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      name = 'Screen',
      showDetails = __DEV__,
      showRetry = true,
    } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f0f23']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={64} color="#ef4444" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Something went wrong</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              We&apos;re sorry, but something unexpected happened in {name}.
            </Text>

            {/* Error Details (Dev Mode) */}
            {showDetails && error && (
              <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.errorCard}>
                  <Text style={styles.errorLabel}>Error:</Text>
                  <Text style={styles.errorMessage}>{error.message}</Text>

                  {error.stack && (
                    <>
                      <Text style={styles.errorLabel}>Stack Trace:</Text>
                      <Text style={styles.stackTrace}>{error.stack}</Text>
                    </>
                  )}

                  {errorInfo?.componentStack && (
                    <>
                      <Text style={styles.errorLabel}>Component Stack:</Text>
                      <Text style={styles.stackTrace}>{errorInfo.componentStack}</Text>
                    </>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {showRetry && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={this.handleRetry}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Help Text */}
            <Text style={styles.helpText}>
              If this problem persists, please restart the app or contact support.
            </Text>
          </View>
        </View>
      );
    }

    return children;
  }
}

/**
 * Screen-level Error Boundary wrapper
 * Use this to wrap entire screens/navigators
 */
interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Screen Error Boundary component.
 *
 */
export function ScreenErrorBoundary({
  children,
  screenName,
  onError,
}: ScreenErrorBoundaryProps): React.ReactElement {
  return (
    <ErrorBoundary name={screenName} showRetry={true} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component-level Error Boundary wrapper
 * Use for individual components that might fail
 */
interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
}

/**
 * Component Error Boundary component.
 *
 */
export function ComponentErrorBoundary({
  children,
  componentName = 'Component',
  fallback,
}: ComponentErrorBoundaryProps): React.ReactElement {
  const defaultFallback = (
    <View style={styles.componentFallback}>
      <Ionicons name="alert-circle-outline" size={24} color="#6b7280" />
      <Text style={styles.componentFallbackText}>Failed to load {componentName}</Text>
    </View>
  );

  return (
    <ErrorBoundary
      name={componentName}
      fallback={fallback || defaultFallback}
      showRetry={false}
      showDetails={false}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  boundaryName?: string
): ((props: P) => React.ReactElement) & { displayName?: string } {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  const name = boundaryName || displayName;

  function WithErrorBoundary(props: P): React.ReactElement {
    return (
      <ErrorBoundary name={name}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  detailsContainer: {
    maxHeight: 200,
    width: SCREEN_WIDTH - 48,
    marginBottom: 24,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 12,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#fca5a5',
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  componentFallback: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  componentFallbackText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ErrorBoundary;
