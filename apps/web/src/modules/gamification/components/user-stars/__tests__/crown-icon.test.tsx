/** @module crown-icon tests */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CrownIcon } from '../crown-icon';

describe('CrownIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<CrownIcon />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies className', () => {
    const { container } = render(<CrownIcon className="h-6 w-6 text-yellow-400" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('class')).toContain('text-yellow-400');
  });

  it('applies inline style', () => {
    const { container } = render(<CrownIcon style={{ opacity: 0.5 }} />);
    const svg = container.querySelector('svg')!;
    expect(svg.style.opacity).toBe('0.5');
  });

  it('has a viewBox attribute', () => {
    const { container } = render(<CrownIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('uses currentColor for fill', () => {
    const { container } = render(<CrownIcon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('fill')).toBe('currentColor');
  });
});
