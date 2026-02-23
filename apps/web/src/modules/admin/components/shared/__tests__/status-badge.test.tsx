/** @module status-badge tests */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active')).toBeTruthy();
  });

  it('applies green color for active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active').className).toContain('text-green-700');
  });

  it('applies red color for banned status', () => {
    render(<StatusBadge status="banned" />);
    expect(screen.getByText('banned').className).toContain('text-red-700');
  });

  it('applies gray color for deleted status', () => {
    render(<StatusBadge status="deleted" />);
    expect(screen.getByText('deleted').className).toContain('text-gray-700');
  });

  it('applies yellow color for pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('pending').className).toContain('text-yellow-700');
  });

  it('falls back to active colors for unknown status', () => {
    render(<StatusBadge status="unknown" />);
    const el = screen.getByText('unknown');
    expect(el.className).toContain('text-green-700');
  });

  it('has capitalize class for text transform', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active').className).toContain('capitalize');
  });
});
