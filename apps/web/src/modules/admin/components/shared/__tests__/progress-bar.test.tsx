/** @module progress-bar tests */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../progress-bar';

describe('ProgressBar', () => {
  it('renders the label', () => {
    render(<ProgressBar label="CPU Usage" value={50} max={100} unit="%" />);
    expect(screen.getByText('CPU Usage')).toBeTruthy();
  });

  it('renders value with unit', () => {
    render(<ProgressBar label="Memory" value={8} max={16} unit="GB" />);
    expect(screen.getByText('8GB')).toBeTruthy();
  });

  it('calculates correct percentage width', () => {
    const { container } = render(<ProgressBar label="Disk" value={75} max={100} unit="%" />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('75%');
  });

  it('caps percentage at 100%', () => {
    const { container } = render(<ProgressBar label="Over" value={150} max={100} unit="%" />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('100%');
  });

  it('applies green color for low percentage', () => {
    const { container } = render(<ProgressBar label="Low" value={30} max={100} unit="%" />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('bg-green-500');
  });

  it('applies yellow color for medium percentage', () => {
    const { container } = render(<ProgressBar label="Med" value={70} max={100} unit="%" />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('bg-yellow-500');
  });

  it('applies red color for high percentage', () => {
    const { container } = render(<ProgressBar label="High" value={90} max={100} unit="%" />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('bg-red-500');
  });
});
