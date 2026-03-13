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
import LoadingSpinner from '../loading-spinner';

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

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      expect(getByTestId('loading-spinner-indicator')).toBeTruthy();
    });

    it('renders activity indicator', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      const indicator = getByTestId('loading-spinner-indicator');
      expect(indicator).toBeTruthy();
    });
  });

  describe('size prop', () => {
    it('renders large size by default', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      // Default testID is 'loading-spinner' so indicator is 'loading-spinner-indicator'
      const indicator = getByTestId('loading-spinner-indicator');
      expect(indicator.props.size).toBe('large');
    });

    it('renders small size when specified', () => {
      const { getByTestId } = render(<LoadingSpinner size="small" />);
      const indicator = getByTestId('loading-spinner-indicator');
      expect(indicator.props.size).toBe('small');
    });

    it('renders large size when specified explicitly', () => {
      const { getByTestId } = render(<LoadingSpinner size="large" />);
      const indicator = getByTestId('loading-spinner-indicator');
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
      const { getByText } = render(<LoadingSpinner text="Fetching data, please wait..." />);
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
      const { queryByTestId, getByTestId } = render(<LoadingSpinner />);
      // Should have container view but not fullscreen wrapper
      expect(getByTestId('loading-spinner')).toBeTruthy();
      expect(queryByTestId('loading-spinner-fullscreen')).toBeNull();
    });

    it('renders fullscreen overlay when fullScreen is true', () => {
      const { getByTestId } = render(<LoadingSpinner fullScreen={true} />);
      // Should have additional fullscreen wrapper view
      expect(getByTestId('loading-spinner-fullscreen')).toBeTruthy();
    });

    it('renders inline when fullScreen is false', () => {
      const { queryByTestId, getByTestId } = render(<LoadingSpinner fullScreen={false} />);
      expect(getByTestId('loading-spinner')).toBeTruthy();
      expect(queryByTestId('loading-spinner-fullscreen')).toBeNull();
    });
  });

  describe('style prop', () => {
    it('applies custom styles', () => {
      const customStyle = { marginTop: 20, padding: 10 };
      const { getByTestId } = render(<LoadingSpinner style={customStyle} />);
      const container = getByTestId('loading-spinner');
      expect(container.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining(customStyle)])
      );
    });

    it('renders with undefined style', () => {
      const { getByTestId } = render(<LoadingSpinner style={undefined} />);
      const indicator = getByTestId('loading-spinner-indicator');
      expect(indicator).toBeTruthy();
    });
  });

  describe('color theming', () => {
    it('uses theme primary color', () => {
      const { getByTestId } = render(<LoadingSpinner />);
      const indicator = getByTestId('loading-spinner-indicator');
      expect(indicator.props.color).toBe('#10b981');
    });
  });

  describe('combinations', () => {
    it('renders small spinner with text', () => {
      const { getByText, getByTestId } = render(<LoadingSpinner size="small" text="Please wait" />);
      expect(getByTestId('loading-spinner-indicator').props.size).toBe('small');
      expect(getByText('Please wait')).toBeTruthy();
    });

    it('renders fullscreen with text and large size', () => {
      const { getByText, getByTestId } = render(
        <LoadingSpinner fullScreen={true} text="Loading your content..." size="large" />
      );
      expect(getByTestId('loading-spinner-indicator').props.size).toBe('large');
      expect(getByText('Loading your content...')).toBeTruthy();
      // Fullscreen has wrapper view
      expect(getByTestId('loading-spinner-fullscreen')).toBeTruthy();
    });

    it('renders all props together', () => {
      const customStyle = { margin: 10 };
      const { getByText, getByTestId } = render(
        <LoadingSpinner size="small" text="Almost done..." fullScreen={true} style={customStyle} />
      );
      expect(getByTestId('loading-spinner-indicator').props.size).toBe('small');
      expect(getByText('Almost done...')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('handles rapid prop changes', () => {
      const { rerender, getByTestId, getByText, queryByText } = render(
        <LoadingSpinner size="large" />
      );

      rerender(<LoadingSpinner size="small" text="Loading..." />);
      expect(getByTestId('loading-spinner-indicator').props.size).toBe('small');
      expect(getByText('Loading...')).toBeTruthy();

      rerender(<LoadingSpinner size="large" />);
      expect(getByTestId('loading-spinner-indicator').props.size).toBe('large');
      expect(queryByText('Loading...')).toBeNull();
    });

    it('handles long loading text', () => {
      const longText =
        'This is a very long loading message that might wrap to multiple lines on smaller screens';
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
      const { getByTestId } = render(<LoadingSpinner />);
      const indicator = getByTestId('loading-spinner-indicator');
      expect(indicator).toBeTruthy();
    });

    it('loading text provides context', () => {
      const { getByText } = render(<LoadingSpinner text="Loading user profile" />);
      // Text provides context for screen readers
      expect(getByText('Loading user profile')).toBeTruthy();
    });
  });
});
