/**
 * @file Tests for RealtimeStat component
 * @module admin/components/shared/realtime-stat
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealtimeStat } from '../shared/realtime-stat';

function MockIcon({ className }: { className?: string }) {
  return <span data-testid="stat-icon" className={className} />;
}

describe('RealtimeStat', () => {
  it('renders label', () => {
    render(<RealtimeStat icon={MockIcon} label="Online Users" value={42} />);
    expect(screen.getByText('Online Users')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<RealtimeStat icon={MockIcon} label="Users" value={1500} />);
    expect(screen.getByText('1500')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<RealtimeStat icon={MockIcon} label="Status" value="Healthy" />);
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('renders icon component', () => {
    render(<RealtimeStat icon={MockIcon} label="CPU" value="45%" />);
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('applies icon styling', () => {
    render(<RealtimeStat icon={MockIcon} label="CPU" value="45%" />);
    const icon = screen.getByTestId('stat-icon');
    expect(icon.className).toContain('h-5');
    expect(icon.className).toContain('w-5');
  });

  it('renders label with small text', () => {
    render(<RealtimeStat icon={MockIcon} label="Memory" value="8GB" />);
    const label = screen.getByText('Memory');
    expect(label.className).toContain('text-xs');
  });

  it('renders value with font-semibold', () => {
    render(<RealtimeStat icon={MockIcon} label="Disk" value="120GB" />);
    const value = screen.getByText('120GB');
    expect(value.className).toContain('font-semibold');
  });

  it('renders zero value correctly', () => {
    render(<RealtimeStat icon={MockIcon} label="Errors" value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
