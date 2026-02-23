/**
 * @file Tests for JobsStatusCard component
 * @module admin/components/shared/jobs-status-card
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the admin types import (type-only but mock preventively)
vi.mock('@/types/admin.types', () => ({}));

import { JobsStatusCard } from '../shared/jobs-status-card';

describe('JobsStatusCard', () => {
  it('renders title', () => {
    render(<JobsStatusCard />);
    expect(screen.getByText('Background Jobs')).toBeInTheDocument();
  });

  it('renders all four job status categories', () => {
    render(<JobsStatusCard jobs={{ pending: 5, executing: 3, failed: 1, completed24h: 100 }} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Executing')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Completed (24h)')).toBeInTheDocument();
  });

  it('renders job counts', () => {
    render(<JobsStatusCard jobs={{ pending: 5, executing: 3, failed: 1, completed24h: 100 }} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders zero counts when jobs prop is undefined', () => {
    render(<JobsStatusCard />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(4);
  });

  it('applies yellow styling for pending', () => {
    const { container } = render(
      <JobsStatusCard jobs={{ pending: 5, executing: 0, failed: 0, completed24h: 0 }} />
    );
    expect(container.innerHTML).toContain('text-yellow-600');
  });

  it('applies blue styling for executing', () => {
    const { container } = render(
      <JobsStatusCard jobs={{ pending: 0, executing: 3, failed: 0, completed24h: 0 }} />
    );
    expect(container.innerHTML).toContain('text-blue-600');
  });

  it('applies red styling for failed', () => {
    const { container } = render(
      <JobsStatusCard jobs={{ pending: 0, executing: 0, failed: 7, completed24h: 0 }} />
    );
    expect(container.innerHTML).toContain('text-red-600');
  });

  it('applies green styling for completed', () => {
    const { container } = render(
      <JobsStatusCard jobs={{ pending: 0, executing: 0, failed: 0, completed24h: 50 }} />
    );
    expect(container.innerHTML).toContain('text-green-600');
  });

  it('renders with card styling', () => {
    const { container } = render(<JobsStatusCard />);
    expect(container.firstElementChild?.className).toContain('rounded-xl');
    expect(container.firstElementChild?.className).toContain('shadow-sm');
  });

  it('renders with grid layout', () => {
    const { container } = render(<JobsStatusCard />);
    expect(container.innerHTML).toContain('grid-cols-2');
  });
});
