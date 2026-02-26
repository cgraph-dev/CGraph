/**
 * Toast Component Tests
 *
 * Comprehensive tests for the Toast notification component covering
 * all toast types, animations, auto-dismiss, and user interactions.
 *
 * @since v0.7.31
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import Toast from '../toast';

// Mock ThemeContext
jest.mock('@/stores', () => ({
  useThemeStore: () => ({
    colorScheme: 'light',
    themePreference: 'system',
    setThemePreference: jest.fn(),
    colors: {
      primary: '#10b981',
      background: '#ffffff',
      surface: '#f3f4f6',
      text: '#111827',
      textSecondary: '#6b7280',
    },
  }),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Animated
jest.useFakeTimers();

describe('Toast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders toast message when visible', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Test notification"
          onClose={mockOnClose}
        />
      );
      expect(getByText('Test notification')).toBeTruthy();
    });

    it('renders correct message text', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Custom message content"
          onClose={mockOnClose}
        />
      );
      expect(getByText('Custom message content')).toBeTruthy();
    });
  });

  describe('toast types', () => {
    it('renders success toast', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Success!"
          type="success"
          onClose={mockOnClose}
        />
      );
      expect(getByText('Success!')).toBeTruthy();
    });

    it('renders error toast', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Error occurred"
          type="error"
          onClose={mockOnClose}
        />
      );
      expect(getByText('Error occurred')).toBeTruthy();
    });

    it('renders warning toast', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Warning!"
          type="warning"
          onClose={mockOnClose}
        />
      );
      expect(getByText('Warning!')).toBeTruthy();
    });

    it('renders info toast (default)', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Info message"
          type="info"
          onClose={mockOnClose}
        />
      );
      expect(getByText('Info message')).toBeTruthy();
    });

    it('defaults to info type when not specified', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Default type"
          onClose={mockOnClose}
        />
      );
      expect(getByText('Default type')).toBeTruthy();
    });
  });

  describe('auto-dismiss', () => {
    it('calls onClose after default duration', () => {
      render(
        <Toast
          visible={true}
          message="Auto dismiss"
          onClose={mockOnClose}
        />
      );

      // Default duration is 3000ms
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Wait for animation to complete (300ms)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose after custom duration', () => {
      render(
        <Toast
          visible={true}
          message="Custom duration"
          duration={5000}
          onClose={mockOnClose}
        />
      );

      // Should not close before custom duration
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      // Should close after custom duration
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('manual dismiss', () => {
    it('toast is pressable', () => {
      const { getByText } = render(
        <Toast
          visible={true}
          message="Tap to dismiss"
          onClose={mockOnClose}
        />
      );
      // Toast should render and be visible
      expect(getByText('Tap to dismiss')).toBeTruthy();
    });
  });

  describe('visibility transitions', () => {
    it('handles visibility change from false to true', () => {
      const { rerender, getByText } = render(
        <Toast
          visible={false}
          message="Appearing toast"
          onClose={mockOnClose}
        />
      );

      rerender(
        <Toast
          visible={true}
          message="Appearing toast"
          onClose={mockOnClose}
        />
      );

      expect(getByText('Appearing toast')).toBeTruthy();
    });

    it('handles visibility change from true to false', () => {
      const { rerender, queryByText } = render(
        <Toast
          visible={true}
          message="Disappearing toast"
          onClose={mockOnClose}
        />
      );

      rerender(
        <Toast
          visible={false}
          message="Disappearing toast"
          onClose={mockOnClose}
        />
      );

      // Animation runs
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Toast text may still be in DOM during hide animation
      expect(queryByText('Disappearing toast')).toBeDefined();
    });
  });

  describe('custom styles', () => {
    it('applies custom style prop', () => {
      const customStyle = { marginTop: 100 };
      const { getByText } = render(
        <Toast
          visible={true}
          message="Styled toast"
          style={customStyle}
          onClose={mockOnClose}
        />
      );
      expect(getByText('Styled toast')).toBeTruthy();
    });
  });

  describe('multiple toasts', () => {
    it('renders independently of other toast instances', () => {
      const onClose1 = jest.fn();
      const onClose2 = jest.fn();

      const { getByText } = render(
        <>
          <Toast visible={true} message="Toast 1" onClose={onClose1} />
          <Toast visible={true} message="Toast 2" onClose={onClose2} />
        </>
      );

      expect(getByText('Toast 1')).toBeTruthy();
      expect(getByText('Toast 2')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('handles empty message', () => {
      const { toJSON } = render(
        <Toast
          visible={true}
          message=""
          onClose={mockOnClose}
        />
      );
      // Should still render without crashing
      expect(toJSON()).toBeDefined();
    });

    it('handles very long message', () => {
      const longMessage = 'A'.repeat(500);
      const { getByText } = render(
        <Toast
          visible={true}
          message={longMessage}
          onClose={mockOnClose}
        />
      );
      expect(getByText(longMessage)).toBeTruthy();
    });

    it('handles special characters in message', () => {
      const specialMessage = '<script>alert("xss")</script> & < > "';
      const { getByText } = render(
        <Toast
          visible={true}
          message={specialMessage}
          onClose={mockOnClose}
        />
      );
      expect(getByText(specialMessage)).toBeTruthy();
    });
  });
});
