/**
 * @file Tests for MetricCard component
 * @module admin/components/shared/metric-card
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...rest }: Record<string, unknown>) => (
      <div className={className as string}>{children as React.ReactNode}</div>
    ),
  },
}));

import { MetricCard } from '../shared/metric-card';

function MockIcon({ className }: { className?: string }) {
  return <span data-testid="metric-icon" className={className} />;
}

describe('MetricCard', () => {
  it('renders title', () => {
    render(
      <MetricCard
        title="Total Users"
        value={1234}
        change="+12%"
        changeType="positive"
        icon={MockIcon}
        color="blue"
      />
    );
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('renders formatted value', () => {
    render(
      <MetricCard
        title="Users"
        value={1234567}
        change="+5%"
        changeType="positive"
        icon={MockIcon}
        color="green"
      />
    );
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('renders change text', () => {
    render(
      <MetricCard
        title="Users"
        value={100}
        change="+12% from last week"
        changeType="positive"
        icon={MockIcon}
        color="blue"
      />
    );
    expect(screen.getByText('+12% from last week')).toBeInTheDocument();
  });

  it('renders icon component', () => {
    render(
      <MetricCard
        title="Users"
        value={100}
        change="+5%"
        changeType="positive"
        icon={MockIcon}
        color="blue"
      />
    );
    expect(screen.getByTestId('metric-icon')).toBeInTheDocument();
  });

  it('applies positive change color', () => {
    render(
      <MetricCard
        title="Users"
        value={100}
        change="+5%"
        changeType="positive"
        icon={MockIcon}
        color="blue"
      />
    );
    const changeEl = screen.getByText('+5%');
    expect(changeEl.className).toContain('text-green-600');
  });

  it('applies negative change color', () => {
    render(
      <MetricCard
        title="Users"
        value={100}
        change="-3%"
        changeType="negative"
        icon={MockIcon}
        color="blue"
      />
    );
    const changeEl = screen.getByText('-3%');
    expect(changeEl.className).toContain('text-red-600');
  });

  it('applies neutral change color', () => {
    render(
      <MetricCard
        title="Users"
        value={100}
        change="0%"
        changeType="neutral"
        icon={MockIcon}
        color="blue"
      />
    );
    const changeEl = screen.getByText('0%');
    expect(changeEl.className).toContain('text-gray-500');
  });

  it('handles zero value', () => {
    render(
      <MetricCard
        title="Users"
        value={0}
        change="N/A"
        changeType="neutral"
        icon={MockIcon}
        color="blue"
      />
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies icon white color class', () => {
    render(
      <MetricCard
        title="Users"
        value={100}
        change="+5%"
        changeType="positive"
        icon={MockIcon}
        color="purple"
      />
    );
    expect(screen.getByTestId('metric-icon').className).toContain('text-white');
  });

  it('renders with different color variants', () => {
    const { container } = render(
      <MetricCard
        title="Errors"
        value={5}
        change="+2"
        changeType="negative"
        icon={MockIcon}
        color="red"
      />
    );
    expect(container.innerHTML).toContain('from-red-500');
  });
});
