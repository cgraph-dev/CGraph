/**
 * @file Tests for StatItem component (profile-card)
 * @module social/components/profile-card/stat-item
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { StatItem } from '../profile-card/stat-item';

describe('StatItem', () => {
  it('renders the value', () => {
    render(<StatItem label="Posts" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<StatItem label="Posts" value={42} />);
    expect(screen.getByText('Posts')).toBeInTheDocument();
  });

  it('formats large numbers with locale string', () => {
    render(<StatItem label="Messages" value={1234567} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('renders suffix when provided', () => {
    render(<StatItem label="Level" value={10} suffix="%" />);
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('does not render suffix when not provided', () => {
    render(<StatItem label="Posts" value={42} />);
    const valueEl = screen.getByText('42');
    expect(valueEl.textContent).toBe('42');
  });

  it('applies color to value text', () => {
    render(<StatItem label="Posts" value={42} color="#ff0000" />);
    const valueEl = screen.getByText('42');
    expect(valueEl).toHaveStyle({ color: '#ff0000' });
  });

  it('applies color-based background', () => {
    const { container } = render(<StatItem label="Posts" value={42} color="#ff0000" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ backgroundColor: '#ff000011' });
  });

  it('renders zero value', () => {
    render(<StatItem label="Friends" value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders negative value', () => {
    render(<StatItem label="Karma" value={-5} />);
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('renders with empty suffix string', () => {
    render(<StatItem label="Score" value={100} suffix="" />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
