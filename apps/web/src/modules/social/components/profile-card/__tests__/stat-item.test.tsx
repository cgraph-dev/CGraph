/** @module stat-item tests */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatItem } from '../stat-item';

describe('StatItem', () => {
  it('renders the label', () => {
    render(<StatItem label="Posts" value={42} color="#3b82f6" />);
    expect(screen.getByText('Posts')).toBeTruthy();
  });

  it('renders the formatted value', () => {
    render(<StatItem label="Score" value={1234} color="#10b981" />);
    expect(screen.getByText('1,234')).toBeTruthy();
  });

  it('renders suffix when provided', () => {
    render(<StatItem label="Uptime" value={99} suffix="%" color="#f59e0b" />);
    expect(screen.getByText('99%')).toBeTruthy();
  });

  it('applies color to value', () => {
    render(<StatItem label="Level" value={5} color="#8b5cf6" />);
    const valueEl = screen.getByText('5');
    expect(valueEl.style.color).toBe('rgb(139, 92, 246)');
  });

  it('applies background color with opacity', () => {
    const { container } = render(<StatItem label="XP" value={100} color="#ef4444" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.backgroundColor).toBeTruthy();
  });

  it('renders without suffix by default', () => {
    render(<StatItem label="Friends" value={7} color="#06b6d4" />);
    expect(screen.getByText('7')).toBeTruthy();
  });
});
