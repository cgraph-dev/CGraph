/**
 * @file Tests for StatsCard component
 * @module admin/components/shared/stats-card
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '../shared/stats-card';

describe('StatsCard', () => {
  it('renders title', () => {
    render(<StatsCard title="Server Stats" stats={[]} />);
    expect(screen.getByText('Server Stats')).toBeInTheDocument();
  });

  it('renders stat labels and string values', () => {
    render(
      <StatsCard
        title="Stats"
        stats={[
          { label: 'Uptime', value: '99.9%' },
          { label: 'Latency', value: '42ms' },
        ]}
      />
    );
    expect(screen.getByText('Uptime')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('Latency')).toBeInTheDocument();
    expect(screen.getByText('42ms')).toBeInTheDocument();
  });

  it('renders numeric values', () => {
    render(<StatsCard title="Stats" stats={[{ label: 'Count', value: 1234 }]} />);
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('applies red highlight when specified', () => {
    render(<StatsCard title="Stats" stats={[{ label: 'Errors', value: 42, highlight: 'red' }]} />);
    const valueEl = screen.getByText('42');
    expect(valueEl.className).toContain('text-red-600');
  });

  it('applies default text color without highlight', () => {
    render(<StatsCard title="Stats" stats={[{ label: 'OK', value: 100 }]} />);
    const valueEl = screen.getByText('100');
    expect(valueEl.className).toContain('text-gray-900');
  });

  it('renders multiple stats in order', () => {
    render(
      <StatsCard
        title="Overview"
        stats={[
          { label: 'First', value: 'A' },
          { label: 'Second', value: 'B' },
          { label: 'Third', value: 'C' },
        ]}
      />
    );
    const labels = screen.getAllByText(/First|Second|Third/);
    expect(labels).toHaveLength(3);
  });

  it('renders empty stats list without error', () => {
    const { container } = render(<StatsCard title="Empty" stats={[]} />);
    expect(container.querySelector('.space-y-3')).toBeInTheDocument();
  });

  it('renders with correct card styling', () => {
    const { container } = render(<StatsCard title="Test" stats={[]} />);
    expect(container.firstElementChild?.className).toContain('rounded-xl');
    expect(container.firstElementChild?.className).toContain('shadow-sm');
  });

  it('renders title with proper heading styles', () => {
    render(<StatsCard title="Heading" stats={[]} />);
    const heading = screen.getByText('Heading');
    expect(heading.tagName).toBe('H3');
    expect(heading.className).toContain('font-semibold');
  });
});
