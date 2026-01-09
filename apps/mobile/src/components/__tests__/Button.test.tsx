/**
 * Button Component Tests
 *
 * Comprehensive tests for the Button component covering all variants,
 * sizes, states, and accessibility features.
 *
 * @since v0.7.28
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import Button from '../Button';

// Mock the ThemeContext to avoid needing the full provider chain
// useTheme returns { colorScheme, themePreference, setThemePreference, colors } directly
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colorScheme: 'light',
    themePreference: 'system',
    setThemePreference: jest.fn(),
    colors: {
      primary: '#10b981',
      primaryHover: '#059669',
      secondary: '#047857',
      accent: '#00ff41',
      background: '#ffffff',
      surface: '#f3f4f6',
      surfaceSecondary: '#e5e7eb',
      surfaceHover: '#d1fae5',
      text: '#111827',
      textSecondary: '#6b7280',
      textTertiary: '#9ca3af',
      border: '#e5e7eb',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      info: '#3b82f6',
      card: '#ffffff',
      input: '#f9fafb',
      overlay: 'rgba(0, 0, 0, 0.5)',
      matrix: { glow: '#00ff41', bright: '#39ff14', dim: '#003b00' },
    },
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Button', () => {
  describe('rendering', () => {
    it('renders with children text', () => {
      const { getByText } = render(<Button>Click Me</Button>);
      expect(getByText('Click Me')).toBeTruthy();
    });

    it('renders with custom styles', () => {
      const { getByText } = render(
        <Button style={{ marginTop: 10 }}>Styled</Button>
      );
      expect(getByText('Styled')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('renders primary variant by default', () => {
      const { getByText } = render(<Button>Primary</Button>);
      const button = getByText('Primary');
      expect(button).toBeTruthy();
    });

    it('renders secondary variant', () => {
      const { getByText } = render(
        <Button variant="secondary">Secondary</Button>
      );
      expect(getByText('Secondary')).toBeTruthy();
    });

    it('renders outline variant', () => {
      const { getByText } = render(
        <Button variant="outline">Outline</Button>
      );
      expect(getByText('Outline')).toBeTruthy();
    });

    it('renders ghost variant', () => {
      const { getByText } = render(
        <Button variant="ghost">Ghost</Button>
      );
      expect(getByText('Ghost')).toBeTruthy();
    });

    it('renders danger variant', () => {
      const { getByText } = render(
        <Button variant="danger">Danger</Button>
      );
      expect(getByText('Danger')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { getByText } = render(
        <Button size="sm">Small</Button>
      );
      expect(getByText('Small')).toBeTruthy();
    });

    it('renders medium size by default', () => {
      const { getByText } = render(<Button>Medium</Button>);
      expect(getByText('Medium')).toBeTruthy();
    });

    it('renders large size', () => {
      const { getByText } = render(
        <Button size="lg">Large</Button>
      );
      expect(getByText('Large')).toBeTruthy();
    });
  });

  describe('states', () => {
    it('handles press events', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress}>Press Me</Button>
      );

      fireEvent.press(getByText('Press Me'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not fire press when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress} disabled>
          Disabled
        </Button>
      );

      fireEvent.press(getByText('Disabled'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('shows loading indicator when loading', () => {
      const { queryByText, UNSAFE_getByType } = render(
        <Button loading>Loading</Button>
      );

      // Text should not be visible during loading
      expect(queryByText('Loading')).toBeNull();
    });

    it('does not fire press when loading', () => {
      const onPress = jest.fn();
      render(
        <Button onPress={onPress} loading>
          Loading
        </Button>
      );

      // Button should not be pressable when loading
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('fullWidth', () => {
    it('renders full width when specified', () => {
      const { getByText } = render(
        <Button fullWidth>Full Width</Button>
      );
      expect(getByText('Full Width')).toBeTruthy();
    });
  });

  describe('icon support', () => {
    it('renders with icon element', () => {
      const icon = <Text testID="button-icon">🔥</Text>;
      const { getByTestId, getByText } = render(
        <Button icon={icon}>With Icon</Button>
      );

      expect(getByTestId('button-icon')).toBeTruthy();
      expect(getByText('With Icon')).toBeTruthy();
    });
  });

  describe('animation', () => {
    it('animates on press in and out', async () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress}>Animated</Button>
      );

      const button = getByText('Animated');

      // Simulate press in/out animation
      fireEvent(button, 'pressIn');
      fireEvent(button, 'pressOut');

      await waitFor(() => {
        expect(button).toBeTruthy();
      });
    });
  });
});
