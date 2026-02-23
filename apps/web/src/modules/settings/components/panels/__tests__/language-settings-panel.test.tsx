/** @module language-settings-panel tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ..._props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockUpdateLocaleSettings = vi.fn().mockResolvedValue(undefined);

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      locale: {
        language: 'en',
        dateFormat: 'mdy',
        timeFormat: 'twelve_hour',
      },
    },
    updateLocaleSettings: mockUpdateLocaleSettings,
    isSaving: false,
  })),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { LanguageSettingsPanel } from '../language-settings-panel';

describe('LanguageSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders language select', () => {
    render(<LanguageSettingsPanel />);
    expect(screen.getByText(/Interface Language/i)).toBeInTheDocument();
  });

  it('renders date format select', () => {
    render(<LanguageSettingsPanel />);
    expect(screen.getByText(/Date Format/i)).toBeInTheDocument();
  });

  it('renders time format select', () => {
    render(<LanguageSettingsPanel />);
    expect(screen.getByText(/Time Format/i)).toBeInTheDocument();
  });

  it('renders all language options', () => {
    render(<LanguageSettingsPanel />);
    const selects = screen.getAllByRole('combobox');
    // Language select should have 10 options
    const languageSelect = selects[0];
    expect(languageSelect).toBeInTheDocument();
    expect(languageSelect.querySelectorAll('option').length).toBeGreaterThanOrEqual(5);
  });

  it('renders date format options', () => {
    render(<LanguageSettingsPanel />);
    expect(screen.getByText('MM/DD/YYYY')).toBeInTheDocument();
    expect(screen.getByText('DD/MM/YYYY')).toBeInTheDocument();
    expect(screen.getByText('YYYY-MM-DD')).toBeInTheDocument();
  });

  it('renders time format options', () => {
    render(<LanguageSettingsPanel />);
    expect(screen.getByText(/12-hour/)).toBeInTheDocument();
    expect(screen.getByText(/24-hour/)).toBeInTheDocument();
  });

  it('calls updateLocaleSettings when language changes', async () => {
    render(<LanguageSettingsPanel />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'es' } });

    await waitFor(() => {
      expect(mockUpdateLocaleSettings).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'es' })
      );
    });
  });

  it('calls updateLocaleSettings when date format changes', async () => {
    render(<LanguageSettingsPanel />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'dmy' } });

    await waitFor(() => {
      expect(mockUpdateLocaleSettings).toHaveBeenCalledWith(
        expect.objectContaining({ dateFormat: 'dmy' })
      );
    });
  });

  it('calls updateLocaleSettings when time format changes', async () => {
    render(<LanguageSettingsPanel />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: 'twenty_four_hour' } });

    await waitFor(() => {
      expect(mockUpdateLocaleSettings).toHaveBeenCalledWith(
        expect.objectContaining({ timeFormat: 'twenty_four_hour' })
      );
    });
  });

  it('defaults to English', () => {
    render(<LanguageSettingsPanel />);
    const selects = screen.getAllByRole('combobox');
    expect(selects[0]).toHaveValue('en');
  });
});
