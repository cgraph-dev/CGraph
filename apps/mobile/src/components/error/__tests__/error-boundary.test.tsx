/**
 * ErrorBoundary Component Tests
 *
 * Tests for the error boundary component functionality.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import {
  ErrorBoundary,
  ScreenErrorBoundary,
  ComponentErrorBoundary,
  withErrorBoundary,
} from '../error-boundary';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }: { children: React.ReactNode; style?: object }) => (
      <View style={style}>{children}</View>
    ),
  };
});

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>Working Component</Text>;
};

// Component that throws on specific action
const ConditionalThrowComponent = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Triggered error');
  }

  return (
    <View>
      <Text>Safe Content</Text>
      <Text onPress={() => setShouldThrow(true)}>Trigger Error</Text>
    </View>
  );
};

describe('ErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  describe('basic functionality', () => {
    it('should render children when no error', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>Child Content</Text>
        </ErrorBoundary>
      );

      expect(getByText('Child Content')).toBeTruthy();
    });

    it('should catch errors and render fallback UI', () => {
      const { getByText, queryByText } = render(
        <ErrorBoundary name="TestBoundary">
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(getByText('Something went wrong')).toBeTruthy();
      expect(queryByText('Working Component')).toBeNull();
    });

    it('should display boundary name in error message', () => {
      const { getByText } = render(
        <ErrorBoundary name="ProfileScreen">
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(getByText(/ProfileScreen/)).toBeTruthy();
    });

    it('should show retry button by default', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should hide retry button when showRetry is false', () => {
      const { queryByText } = render(
        <ErrorBoundary showRetry={false}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(queryByText('Try Again')).toBeNull();
    });
  });

  describe('error details', () => {
    it('should show error details in dev mode', () => {
      const { getByText } = render(
        <ErrorBoundary showDetails={true}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(getByText('Test error')).toBeTruthy();
    });

    it('should hide error details when showDetails is false', () => {
      const { queryByText } = render(
        <ErrorBoundary showDetails={false}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(queryByText('Test error')).toBeNull();
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const CustomFallback = <Text>Custom Error View</Text>;

      const { getByText, queryByText } = render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(getByText('Custom Error View')).toBeTruthy();
      expect(queryByText('Something went wrong')).toBeNull();
    });
  });

  describe('retry functionality', () => {
    it('should reset error state on retry', async () => {
      // Simple test: component that tracks state to recover after reset
      let shouldRecover = false;
      const RecoverableComponent = () => {
        if (!shouldRecover) {
          throw new Error('Intentional test error');
        }
        return <Text>Recovered</Text>;
      };

      // Suppress console.error for this test (expected error)
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { getByText, queryByText } = render(
        <ErrorBoundary>
          <RecoverableComponent />
        </ErrorBoundary>
      );

      // Error should be caught and fallback UI shown
      expect(queryByText('Something went wrong')).toBeTruthy();
      expect(queryByText('Recovered')).toBeNull();

      // Set flag to allow recovery
      shouldRecover = true;

      // Press retry button
      fireEvent.press(getByText('Try Again'));

      // After retry, the component should recover since shouldRecover is true
      await waitFor(() => {
        expect(queryByText('Recovered')).toBeTruthy();
      });

      errorSpy.mockRestore();
    });

    it('should call onRetry callback when retry is pressed', async () => {
      const onRetry = jest.fn();

      const { getByText } = render(
        <ErrorBoundary onRetry={onRetry}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      fireEvent.press(getByText('Try Again'));

      await waitFor(() => {
        expect(onRetry).toHaveBeenCalled();
      });
    });
  });

  describe('onError callback', () => {
    it('should call onError when error is caught', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });
});

describe('ScreenErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should wrap children with error boundary', () => {
    const { getByText } = render(
      <ScreenErrorBoundary screenName="HomeScreen">
        <Text>Home Content</Text>
      </ScreenErrorBoundary>
    );

    expect(getByText('Home Content')).toBeTruthy();
  });

  it('should show screen name in error message', () => {
    const { getByText } = render(
      <ScreenErrorBoundary screenName="ProfileScreen">
        <ThrowingComponent />
      </ScreenErrorBoundary>
    );

    expect(getByText(/ProfileScreen/)).toBeTruthy();
  });
});

describe('ComponentErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render compact fallback for component errors', () => {
    const { getByText } = render(
      <ComponentErrorBoundary componentName="UserAvatar">
        <ThrowingComponent />
      </ComponentErrorBoundary>
    );

    expect(getByText('Failed to load UserAvatar')).toBeTruthy();
  });

  it('should use custom fallback when provided', () => {
    const { getByText } = render(
      <ComponentErrorBoundary fallback={<Text>Custom Component Error</Text>}>
        <ThrowingComponent />
      </ComponentErrorBoundary>
    );

    expect(getByText('Custom Component Error')).toBeTruthy();
  });
});

describe('withErrorBoundary HOC', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should wrap component with error boundary', () => {
    const MyComponent = () => <Text>My Component</Text>;
    const WrappedComponent = withErrorBoundary(MyComponent, 'MyComponent');

    const { getByText } = render(<WrappedComponent />);

    expect(getByText('My Component')).toBeTruthy();
  });

  it('should catch errors from wrapped component', () => {
    const WrappedThrowing = withErrorBoundary(ThrowingComponent, 'ThrowingComponent');

    const { getByText } = render(<WrappedThrowing />);

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should set display name correctly', () => {
    const MyComponent = () => <Text>Test</Text>;
    MyComponent.displayName = 'CustomDisplayName';

    const Wrapped = withErrorBoundary(MyComponent);

    expect(Wrapped.displayName).toBe('withErrorBoundary(CustomDisplayName)');
  });
});
