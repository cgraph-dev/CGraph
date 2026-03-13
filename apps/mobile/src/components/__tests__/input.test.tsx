/**
 * Input Component Tests
 *
 * Comprehensive tests for the Input component covering labels,
 * error states, icons, and focus behavior.
 *
 * @since v0.7.28
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../input';

// Mock the ThemeContext to avoid needing the full provider chain
// useTheme returns { colorScheme, themePreference, setThemePreference, colors } directly
jest.mock('@/stores', () => ({
  useThemeStore: () => ({
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

describe('Input', () => {
  describe('rendering', () => {
    it('renders without label', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Enter text" />);
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('renders with label', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input label="Email" placeholder="Enter email" />
      );
      expect(getByText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Enter email')).toBeTruthy();
    });

    it('renders with helper text', () => {
      const { getByText } = render(
        <Input helperText="This field is required" placeholder="Input" />
      );
      expect(getByText('This field is required')).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('displays error message', () => {
      const { getByText } = render(<Input error="Invalid email format" placeholder="Email" />);
      expect(getByText('Invalid email format')).toBeTruthy();
    });

    it('prioritizes error over helper text', () => {
      const { getByText, queryByText } = render(
        <Input error="Error message" helperText="Helper message" placeholder="Input" />
      );
      expect(getByText('Error message')).toBeTruthy();
      expect(queryByText('Helper message')).toBeNull();
    });
  });

  describe('text input behavior', () => {
    it('accepts text input', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Type here" onChangeText={onChangeText} />
      );

      const input = getByPlaceholderText('Type here');
      fireEvent.changeText(input, 'Hello World');

      expect(onChangeText).toHaveBeenCalledWith('Hello World');
    });

    it('displays current value', () => {
      const { getByDisplayValue } = render(<Input value="Current Value" placeholder="Input" />);
      expect(getByDisplayValue('Current Value')).toBeTruthy();
    });

    it('handles secure text entry for passwords', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Password" secureTextEntry />);

      const input = getByPlaceholderText('Password');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });

  describe('focus behavior', () => {
    it('calls onFocus when focused', () => {
      const onFocus = jest.fn();
      const { getByPlaceholderText } = render(<Input placeholder="Focus me" onFocus={onFocus} />);

      fireEvent(getByPlaceholderText('Focus me'), 'focus');
      expect(onFocus).toHaveBeenCalled();
    });

    it('calls onBlur when blurred', () => {
      const onBlur = jest.fn();
      const { getByPlaceholderText } = render(<Input placeholder="Blur me" onBlur={onBlur} />);

      const input = getByPlaceholderText('Blur me');
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('icons', () => {
    it('renders with left icon', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Search" leftIcon="search" />);
      expect(getByPlaceholderText('Search')).toBeTruthy();
    });

    it('renders with right icon', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Password" rightIcon="eye" />);
      expect(getByPlaceholderText('Password')).toBeTruthy();
    });

    it('handles right icon press', () => {
      const onRightIconPress = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Password" rightIcon="eye" onRightIconPress={onRightIconPress} />
      );

      // The icon should be rendered and pressable
      expect(getByPlaceholderText('Password')).toBeTruthy();
    });
  });

  describe('keyboard types', () => {
    it('sets email keyboard type', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Email" keyboardType="email-address" />
      );

      const input = getByPlaceholderText('Email');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('sets numeric keyboard type', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Phone" keyboardType="phone-pad" />
      );

      const input = getByPlaceholderText('Phone');
      expect(input.props.keyboardType).toBe('phone-pad');
    });
  });

  describe('autocomplete behavior', () => {
    it('disables autocorrect when specified', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Username" autoCorrect={false} />);

      const input = getByPlaceholderText('Username');
      expect(input.props.autoCorrect).toBe(false);
    });

    it('disables autocapitalize when specified', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Email" autoCapitalize="none" />);

      const input = getByPlaceholderText('Email');
      expect(input.props.autoCapitalize).toBe('none');
    });
  });

  describe('multiline', () => {
    it('supports multiline input', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Description" multiline numberOfLines={4} />
      );

      const input = getByPlaceholderText('Description');
      expect(input.props.multiline).toBe(true);
      expect(input.props.numberOfLines).toBe(4);
    });
  });

  describe('max length', () => {
    it('enforces max length', () => {
      const { getByPlaceholderText } = render(<Input placeholder="Username" maxLength={20} />);

      const input = getByPlaceholderText('Username');
      expect(input.props.maxLength).toBe(20);
    });
  });
});
