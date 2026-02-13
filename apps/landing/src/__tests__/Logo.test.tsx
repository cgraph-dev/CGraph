/**
 * Logo Component Tests
 *
 * Smoke tests for the CGraph Logo component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogoIcon } from '../components/Logo';

describe('LogoIcon', () => {
  it('renders an image with alt text', () => {
    render(<LogoIcon />);
    const img = screen.getByAltText('CGraph');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/logo.png');
  });

  it('applies custom size', () => {
    render(<LogoIcon size={64} />);
    const img = screen.getByAltText('CGraph');
    expect(img).toHaveAttribute('width', '64');
    expect(img).toHaveAttribute('height', '64');
  });

  it('uses default size of 40', () => {
    render(<LogoIcon />);
    const img = screen.getByAltText('CGraph');
    expect(img).toHaveAttribute('width', '40');
    expect(img).toHaveAttribute('height', '40');
  });

  it('applies custom className', () => {
    render(<LogoIcon className="custom-class" />);
    const img = screen.getByAltText('CGraph');
    expect(img).toHaveClass('custom-class');
  });

  it('is not draggable', () => {
    render(<LogoIcon />);
    const img = screen.getByAltText('CGraph');
    expect(img).toHaveAttribute('draggable', 'false');
  });
});
