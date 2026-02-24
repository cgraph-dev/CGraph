/** @module SystemHealthCard tests */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('./progress-bar', () => ({
  ProgressBar: ({ label, value, unit }: { label: string; value: number; unit: string }) => (
    <div data-testid={`progress-${label.replace(/\s/g, '-').toLowerCase()}`}>
      {label}: {value}{unit}
    </div>
  ),
}));

import { SystemHealthCard } from '../shared/system-health-card';

describe('SystemHealthCard', () => {
  it('renders the "System Health" heading', () => {
    render(<SystemHealthCard />);
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('renders Memory Usage progress bar', () => {
    render(<SystemHealthCard />);
    expect(screen.getByTestId('progress-memory-usage')).toBeInTheDocument();
  });

  it('renders CPU Usage progress bar', () => {
    render(<SystemHealthCard />);
    expect(screen.getByTestId('progress-cpu-usage')).toBeInTheDocument();
  });

  it('renders DB Connections progress bar', () => {
    render(<SystemHealthCard />);
    expect(screen.getByTestId('progress-db-connections')).toBeInTheDocument();
  });

  it('shows zero values when no metrics provided', () => {
    render(<SystemHealthCard />);
    expect(screen.getByTestId('progress-memory-usage')).toHaveTextContent('0MB');
    expect(screen.getByTestId('progress-cpu-usage')).toHaveTextContent('0%');
    expect(screen.getByTestId('progress-db-connections')).toHaveTextContent('0');
  });

  it('shows actual metrics values when provided', () => {
    const metrics = {
      system: {
        memoryUsageMb: 512,
        cpuUsagePercent: 45,
        dbConnections: 20,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<SystemHealthCard metrics={metrics as any} />);
    expect(screen.getByTestId('progress-memory-usage')).toHaveTextContent('512MB');
    expect(screen.getByTestId('progress-cpu-usage')).toHaveTextContent('45%');
    expect(screen.getByTestId('progress-db-connections')).toHaveTextContent('20');
  });

  it('renders as a card with border', () => {
    const { container } = render(<SystemHealthCard />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('rounded-xl');
    expect(card.className).toContain('border');
  });

  it('renders heading as h3', () => {
    render(<SystemHealthCard />);
    const heading = screen.getByText('System Health');
    expect(heading.tagName).toBe('H3');
  });
});
