import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GridIcon, ListIcon } from '../icons';

describe('GridIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<GridIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct dimensions', () => {
    const { container } = render(<GridIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });
});

describe('ListIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<ListIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct dimensions', () => {
    const { container } = render(<ListIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });
});
