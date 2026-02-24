/**
 * @file appearance-settings.test.tsx
 * @description Tests for AppearanceSettingsEnhanced component — comprehensive
 *   theme customization panel with visual theme picker, font scaling, etc.
 * @module settings/components/__tests__/AppearanceSettingsEnhanced
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

vi.mock('@/stores/theme', () => ({ useThemeStore: () => ({ theme: { colorPreset: 'blue' } }), THEME_COLORS: { blue: { primary: '#3b82f6', accent: '#8b5cf6' } } }));

const mockThemeContext = {
  theme: { id: 'midnight', name: 'Midnight', category: 'dark', isBuiltIn: true, colors: {} },
  preferences: { settings: { fontScale: 1, messageSpacing: 'comfortable', messageDisplay: 'cozy', backgroundEffect: 'none', shaderVariant: 'default', backgroundIntensity: 0.6, reduceMotion: false, highContrast: false } },
  availableThemes: [],
  isSystemPreference: false,
  setTheme: vi.fn(),
  updateSettings: vi.fn(),
  setFontScale: vi.fn(),
  setMessageDisplay: vi.fn(),
  setMessageSpacing: vi.fn(),
  toggleReduceMotion: vi.fn(),
  toggleHighContrast: vi.fn(),
  toggleSystemPreference: vi.fn(),
  deleteCustomTheme: vi.fn(),
};

vi.mock('@/contexts/theme-context-enhanced', () => ({
  useThemeEnhanced: () => mockThemeContext,
}));

vi.mock('./theme-selection', () => ({
  ThemeSelection: () => <div data-testid="theme-selection">ThemeSelection</div>,
}));
vi.mock('./display-options', () => ({
  DisplayOptions: () => <div data-testid="display-options">DisplayOptions</div>,
}));
vi.mock('./background-effects', () => ({
  BackgroundEffects: () => <div data-testid="bg-effects">BackgroundEffects</div>,
}));
vi.mock('./accessibility', () => ({
  Accessibility: () => <div data-testid="accessibility">Accessibility</div>,
}));
vi.mock('./live-preview', () => ({
  LivePreview: () => <div data-testid="live-preview">LivePreview</div>,
}));

import { AppearanceSettingsEnhanced } from '../appearance-settings/appearance-settings-enhanced';

// ── Tests ──────────────────────────────────────────────────────────────
describe('AppearanceSettingsEnhanced', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the heading', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByText(/Customize how CGraph looks/)).toBeInTheDocument();
  });

  it('renders ThemeSelection section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('theme-selection')).toBeInTheDocument();
  });

  it('renders DisplayOptions section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('display-options')).toBeInTheDocument();
  });

  it('renders BackgroundEffects section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('bg-effects')).toBeInTheDocument();
  });

  it('renders Accessibility section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('accessibility')).toBeInTheDocument();
  });

  it('renders LivePreview section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('live-preview')).toBeInTheDocument();
  });

  it('renders changes saved automatically note', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByText(/Changes are saved automatically/)).toBeInTheDocument();
  });
});
