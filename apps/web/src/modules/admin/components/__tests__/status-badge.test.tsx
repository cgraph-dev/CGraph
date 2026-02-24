/** @module StatusBadge tests */
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

import { StatusBadge } from '../shared/status-badge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('applies green colors for active status', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('active');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-700');
  });

  it('applies red colors for banned status', () => {
    render(<StatusBadge status="banned" />);
    const badge = screen.getByText('banned');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-700');
  });

  it('applies gray colors for deleted status', () => {
    render(<StatusBadge status="deleted" />);
    const badge = screen.getByText('deleted');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('applies yellow colors for pending status', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('pending');
    expect(badge.className).toContain('bg-yellow-100');
    expect(badge.className).toContain('text-yellow-700');
  });

  it('applies green colors for resolved status', () => {
    render(<StatusBadge status="resolved" />);
    const badge = screen.getByText('resolved');
    expect(badge.className).toContain('bg-green-100');
  });

  it('applies gray colors for dismissed status', () => {
    render(<StatusBadge status="dismissed" />);
    const badge = screen.getByText('dismissed');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('falls back to active colors for unknown status', () => {
    render(<StatusBadge status="unknown" />);
    const badge = screen.getByText('unknown');
    expect(badge.className).toContain('bg-green-100');
  });

  it('renders with capitalize class', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active').className).toContain('capitalize');
  });

  it('renders as a span element', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active').tagName).toBe('SPAN');
  });
});
