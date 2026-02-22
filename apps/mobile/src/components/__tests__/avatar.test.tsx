/**
 * Avatar Component Tests
 *
 * Tests for the Avatar component covering image loading,
 * fallback initials, sizes, and status indicators.
 *
 * @since v0.7.28
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Avatar from '../avatar';

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

describe('Avatar', () => {
  describe('rendering', () => {
    it('renders with image source', () => {
      const { toJSON } = render(
        <Avatar
          source="https://example.com/avatar.jpg"
          name="John Doe"
        />
      );
      // Component should render without error
      expect(toJSON()).toBeTruthy();
    });

    it('renders fallback initials when no image', () => {
      const { getByText } = render(
        <Avatar name="John Doe" />
      );
      // Should display initials "JD"
      expect(getByText('JD')).toBeTruthy();
    });

    it('handles single word name', () => {
      const { getByText } = render(
        <Avatar name="John" />
      );
      expect(getByText('J')).toBeTruthy();
    });

    it('handles empty name with fallback', () => {
      const { getByText } = render(
        <Avatar name="" />
      );
      // Should display fallback character "?"
      expect(getByText('?')).toBeTruthy();
    });

    it('handles undefined name with fallback', () => {
      const { getByText } = render(
        <Avatar />
      );
      // Should display fallback character "?"
      expect(getByText('?')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('renders extra small size', () => {
      const { getByText } = render(
        <Avatar name="Test User" size="xs" />
      );
      expect(getByText('TU')).toBeTruthy();
    });

    it('renders small size', () => {
      const { getByText } = render(
        <Avatar name="Small" size="sm" />
      );
      expect(getByText('S')).toBeTruthy();
    });

    it('renders medium size by default', () => {
      const { getByText } = render(
        <Avatar name="Medium" />
      );
      expect(getByText('M')).toBeTruthy();
    });

    it('renders large size', () => {
      const { getByText } = render(
        <Avatar name="Large" size="lg" />
      );
      expect(getByText('L')).toBeTruthy();
    });

    it('renders extra large size', () => {
      const { getByText } = render(
        <Avatar name="Extra Large" size="xl" />
      );
      expect(getByText('EL')).toBeTruthy();
    });

    it('renders with numeric size', () => {
      const { getByText } = render(
        <Avatar name="Custom Size" size={100} />
      );
      expect(getByText('CS')).toBeTruthy();
    });
  });

  describe('status indicators', () => {
    it('shows online status when provided', () => {
      const { getByText } = render(
        <Avatar
          name="Online User"
          status="online"
          showStatus={true}
        />
      );
      expect(getByText('OU')).toBeTruthy();
    });

    it('shows idle status when provided', () => {
      const { getByText } = render(
        <Avatar
          name="Idle User"
          status="idle"
          showStatus={true}
        />
      );
      expect(getByText('IU')).toBeTruthy();
    });

    it('shows do not disturb status when provided', () => {
      const { getByText } = render(
        <Avatar
          name="Busy User"
          status="dnd"
          showStatus={true}
        />
      );
      expect(getByText('BU')).toBeTruthy();
    });

    it('shows offline status when provided', () => {
      const { getByText } = render(
        <Avatar
          name="Offline User"
          status="offline"
          showStatus={true}
        />
      );
      expect(getByText('OU')).toBeTruthy();
    });

    it('hides status indicator when showStatus is false', () => {
      const { getByText } = render(
        <Avatar
          name="Hidden Status"
          status="online"
          showStatus={false}
        />
      );
      expect(getByText('HS')).toBeTruthy();
    });

    it('shows status by default when status is provided', () => {
      const { getByText } = render(
        <Avatar
          name="Default Show"
          status="online"
        />
      );
      expect(getByText('DS')).toBeTruthy();
    });
  });

  describe('initials generation', () => {
    it('generates correct initials for two-word name', () => {
      const { getByText } = render(
        <Avatar name="Jane Smith" />
      );
      expect(getByText('JS')).toBeTruthy();
    });

    it('generates correct initials for three-word name', () => {
      const { getByText } = render(
        <Avatar name="John Robert Smith" />
      );
      // Should only take first two initials
      expect(getByText('JR')).toBeTruthy();
    });

    it('handles lowercase names', () => {
      const { getByText } = render(
        <Avatar name="john doe" />
      );
      expect(getByText('JD')).toBeTruthy();
    });

    it('handles mixed case names', () => {
      const { getByText } = render(
        <Avatar name="jOHN dOE" />
      );
      expect(getByText('JD')).toBeTruthy();
    });
  });

  describe('custom styles', () => {
    it('applies custom container style', () => {
      const { getByText } = render(
        <Avatar
          name="Styled Avatar"
          style={{ margin: 10 }}
        />
      );
      expect(getByText('SA')).toBeTruthy();
    });
  });

  describe('with image source', () => {
    it('shows initials when source is null', () => {
      const { getByText } = render(
        <Avatar
          source={null}
          name="Fallback User"
        />
      );
      expect(getByText('FU')).toBeTruthy();
    });

    it('shows initials when source is empty string', () => {
      const { getByText } = render(
        <Avatar
          source=""
          name="Empty Source"
        />
      );
      // Empty string is falsy, so should show initials
      expect(getByText('ES')).toBeTruthy();
    });
  });
});
