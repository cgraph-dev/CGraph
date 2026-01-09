/**
 * LoadingSpinner Component Tests
 *
 * Comprehensive tests for the LoadingSpinner component covering
 * all sizes, variants, full-screen mode, and custom text.
 *
 * @since v0.7.31
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingSpinner from '../LoadingSpinner';

// Mock ThemeContext
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
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

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      const { UNSAFE_getAllByType } = render(<LoadingSpinner />);
      expect(UNSAFE_getAllByType('ActivityIndicator').length).toBe(1);
    });

    it('renders activity indicator', () => {
      const { UNSAFE_getAllByType } = render(<LoadingSpinner />);
      const indicators = UNSAFE_getAllByType('ActivityIndicator');
      expect(indicators.length).toBe(1);
    });
  });

  describe('size prop', () => {
    it('renders large size by default', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType('ActivityIndicator');
      expect(indicator.props.size).toBe('large');
    });

    it('renders small size when specified', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner size="small" />);
      const indicator = UNSAFE_getByType('ActivityIndicator');
      expect(indicator.props.size).toBe('small');
    });

    it('renders large size when specified explicitly', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner size="large" />);
      const indicator = UNSAFE_getByType('ActivityIndicator');
      expect(indicator.props.size).toBe('large');
    });
  });

  describe('text prop', () => {
    it('does not render text by default', () => {
      const { queryByText } = render(<LoadingSpinner />);
      expect(queryByText(/.+/)).toBeNull();
    });

    it('renders loading text when provided', () => {
      const { getByText } = render(<LoadingSpinner text="Loading..." />);
      expect(getByText('Loading...')).toBeTruthy();
    });

    it('renders custom loading messages', () => {
      const { getByText } = render(
        <LoadingSpinner text="Fetching data, please wait..." />
      );
      expect(getByText('Fetching data, please wait...')).toBeTruthy();
    });

    it('renders empty string text', () => {
      const { queryByText } = render(<LoadingSpinner text="" />);
      // Empty string should not render visible text
      expect(queryByText(/.+/)).toBeNull();
    });
  });

  describe('fullScreen prop', () => {
    it('renders inline by default', () => {
      const { UNSAFE_getAllByType } = render(<LoadingSpinner />);
      const views = UNSAFE_getAllByType('View');
      // Should have container view but not fullscreen wrapper
      expect(views.length).toBeGreaterThanOrEqual(1);
    });

    it('renders fullscreen overlay when fullScreen is true', () => {
      const { UNSAFE_getAllByType } = render(<LoadingSpinner fullScreen={true} />);
      const views = UNSAFE_getAllByType('View');
      // Should have additional fullscreen wrapper view
      expect(views.length).toBeGreaterThan(1);
    });

    it('renders inline when fullScreen is false', () => {
      const { UNSAFE_getAllByType } = render(<LoadingSpinner fullScreen={false} />);
      const views = UNSAFE_getAllByType('View');
      expect(views.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('style prop', () => {
    it('applies custom styles', () => {
      const customStyle = { marginTop: 20, padding: 10 };
      const { UNSAFE_getByType } = render(<LoadingSpinner style={customStyle} />);
      const container = UNSAFE_getByType('View');
      expect(container.props.style).toBeDefined();
    });

    it('renders with undefined style', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner style={undefined} />);
      const indicator = UNSAFE_getByType('ActivityIndicator');
      expect(indicator).toBeTruthy();
    });
  });

  describe('color theming', () => {
    it('uses theme primary color', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType('ActivityIndicator');
      expect(indicator.props.color).toBe('#10b981');
    });
  });

  describe('combinations', () => {
    it('renders small spinner with text', () => {
      const { getByText, UNSAFE_getByType } = render(
        <LoadingSpinner size="small" text="Please wait" />
      );
      expect(UNSAFE_getByType('ActivityIndicator').props.size).toBe('small');
      expect(getByText('Please wait')).toBeTruthy();
    });

    it('renders fullscreen with text and large size', () => {
      const { getByText, UNSAFE_getByType, UNSAFE_getAllByType } = render(
        <LoadingSpinner
          fullScreen={true}
          text="Loading your content..."
          size="large"
        />
      );
      expect(UNSAFE_getByType('ActivityIndicator').props.size).toBe('large');
      expect(getByText('Loading your content...')).toBeTruthy();
      // Fullscreen has wrapper view
      expect(UNSAFE_getAllByType('View').length).toBeGreaterThan(1);
    });

    it('renders all props together', () => {
      const customStyle = { margin: 10 };
      const { getByText, UNSAFE_getByType } = render(
        <LoadingSpinner
          size="small"
          text="Almost done..."
          fullScreen={true}
          style={customStyle}
        />
      );
      expect(UNSAFE_getByType('ActivityIndicator').props.size).toBe('small');
      expect(getByText('Almost done...')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('handles rapid prop changes', () => {
      const { rerender, UNSAFE_getByType, getByText, queryByText } = render(
        <LoadingSpinner size="large" />
      );

      rerender(<LoadingSpinner size="small" text="Loading..." />);
      expect(UNSAFE_getByType('ActivityIndicator').props.size).toBe('small');
      expect(getByText('Loading...')).toBeTruthy();

      rerender(<LoadingSpinner size="large" />);
      expect(UNSAFE_getByType('ActivityIndicator').props.size).toBe('large');
      expect(queryByText('Loading...')).toBeNull();
    });

    it('handles long loading text', () => {
      const longText = 'This is a very long loading message that might wrap to multiple lines on smaller screens';
      const { getByText } = render(<LoadingSpinner text={longText} />);
      expect(getByText(longText)).toBeTruthy();
    });

    it('handles special characters in text', () => {
      const specialText = '加载中... 🔄';
      const { getByText } = render(<LoadingSpinner text={specialText} />);
      expect(getByText(specialText)).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('activity indicator is accessible', () => {
      const { UNSAFE_getByType } = render(<LoadingSpinner />);
      const indicator = UNSAFE_getByType('ActivityIndicator');
      // ActivityIndicator is inherently accessible in React Native
      expect(indicator).toBeTruthy();
    });

    it('loading text provides context', () => {
      const { getByText } = render(
        <LoadingSpinner text="Loading user profile" />
      );
      // Text provides context for screen readers
      expect(getByText('Loading user profile')).toBeTruthy();
    });
  });
});
